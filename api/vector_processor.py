import os
import json
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from openai import OpenAI
from supabase import create_client, Client
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class VectorProcessor:
    def __init__(self):
        """Initialize vector processor with OpenAI and Supabase clients"""
        load_dotenv()
        
        # Initialize OpenAI for embeddings
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Initialize Supabase
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not found in environment")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
        logger.info("Vector processor initialized successfully")
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for given text using OpenAI"""
        try:
            logger.debug(f"Generating embedding for text: {text[:100]}...")
            
            response = self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=text.replace("\n", " ")
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding with dimension: {len(embedding)}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            raise
    
    def store_transcript_embeddings(self, study_id: str, chunk_results: List[Dict]) -> bool:
        """Store embeddings for transcript chunks"""
        try:
            logger.info(f"Storing transcript embeddings for study {study_id}")
            
            embeddings_data = []
            
            for chunk_result in chunk_results:
                if chunk_result.get('error', False):
                    continue
                
                chunk_id = chunk_result.get('chunk_id', '')
                
                # Get themes text for embedding
                themes = chunk_result.get('themes', [])
                themes_text = " ".join([
                    f"{theme.get('theme_name', '')}: {theme.get('description', '')}"
                    for theme in themes
                ])
                
                # Get quotes text
                quotes = chunk_result.get('quotes', [])
                quotes_text = " ".join([quote.get('quote_text', '') for quote in quotes])
                
                # Combine all chunk content for embedding
                chunk_content = f"Themes: {themes_text} Quotes: {quotes_text}"
                
                if not chunk_content.strip():
                    continue
                
                # Generate embedding
                embedding = self.generate_embedding(chunk_content)
                
                embeddings_data.append({
                    'study_id': study_id,
                    'chunk_id': chunk_id,
                    'chunk_text': chunk_content,
                    'embedding': embedding,
                    'metadata': {
                        'themes_count': len(themes),
                        'quotes_count': len(quotes),
                        'analysis_timestamp': chunk_result.get('timestamp')
                    }
                })
            
            # Batch insert to Supabase
            if embeddings_data:
                result = self.supabase.table('transcript_embeddings').insert(embeddings_data).execute()
                logger.info(f"Stored {len(embeddings_data)} transcript embeddings")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to store transcript embeddings: {str(e)}")
            return False
    
    def store_theme_embeddings(self, study_id: str, consolidated_themes: List[Dict]) -> bool:
        """Store embeddings for consolidated themes"""
        try:
            logger.info(f"Storing theme embeddings for study {study_id}")
            
            embeddings_data = []
            
            for theme in consolidated_themes:
                theme_name = theme.get('theme_name', '')
                descriptions = theme.get('descriptions', [])
                description_text = " ".join(descriptions) if descriptions else theme.get('description', '')
                
                # Combine theme name and description for embedding
                theme_content = f"{theme_name}: {description_text}"
                
                if not theme_content.strip():
                    continue
                
                # Generate embedding
                embedding = self.generate_embedding(theme_content)
                
                embeddings_data.append({
                    'study_id': study_id,
                    'theme_name': theme_name,
                    'theme_description': description_text,
                    'embedding': embedding,
                    'frequency': theme.get('frequency', 0),
                    'metadata': {
                        'key_points': theme.get('key_points', []),
                        'source_chunks': theme.get('source_chunks', [])
                    }
                })
            
            # Batch insert to Supabase
            if embeddings_data:
                result = self.supabase.table('theme_embeddings').insert(embeddings_data).execute()
                logger.info(f"Stored {len(embeddings_data)} theme embeddings")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to store theme embeddings: {str(e)}")
            return False
    
    def store_insight_embeddings(self, study_id: str, actionable_insights: List[Dict]) -> bool:
        """Store embeddings for actionable insights"""
        try:
            logger.info(f"Storing insight embeddings for study {study_id}")
            
            embeddings_data = []
            
            for insight in actionable_insights:
                insight_title = insight.get('insight_title', '')
                insight_description = insight.get('insight_description', '')
                
                # Combine title and description for embedding
                insight_content = f"{insight_title}: {insight_description}"
                
                if not insight_content.strip():
                    continue
                
                # Generate embedding
                embedding = self.generate_embedding(insight_content)
                
                embeddings_data.append({
                    'study_id': study_id,
                    'insight_title': insight_title,
                    'insight_description': insight_description,
                    'embedding': embedding,
                    'business_impact': insight.get('business_impact', 'medium'),
                    'metadata': {
                        'recommended_actions': insight.get('recommended_actions', []),
                        'success_metrics': insight.get('success_metrics', []),
                        'timeline': insight.get('timeline', 'short-term')
                    }
                })
            
            # Batch insert to Supabase
            if embeddings_data:
                result = self.supabase.table('insight_embeddings').insert(embeddings_data).execute()
                logger.info(f"Stored {len(embeddings_data)} insight embeddings")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to store insight embeddings: {str(e)}")
            return False
    
    def find_similar_themes(self, query_text: str, study_id: Optional[str] = None, limit: int = 5) -> List[Dict]:
        """Find similar themes using vector similarity"""
        try:
            logger.info(f"Finding similar themes for query: {query_text[:50]}...")
            
            # Generate embedding for query
            query_embedding = self.generate_embedding(query_text)
            
            # Build query
            query = self.supabase.rpc(
                'match_themes',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.7,
                    'match_count': limit,
                    'study_filter': study_id
                }
            )
            
            result = query.execute()
            
            logger.info(f"Found {len(result.data)} similar themes")
            return result.data
            
        except Exception as e:
            logger.error(f"Failed to find similar themes: {str(e)}")
            return []
    
    def process_complete_analysis(self, study_id: str, analysis_result: Dict) -> bool:
        """Process and store all embeddings for a complete analysis"""
        try:
            logger.info(f"Processing complete analysis embeddings for study {study_id}")
            
            complete_analysis = analysis_result.get('complete_analysis', {})
            chunk_results = analysis_result.get('chunk_results', [])
            
            # Store transcript chunk embeddings
            transcript_success = self.store_transcript_embeddings(study_id, chunk_results)
            
            # Store theme embeddings
            consolidated_themes = complete_analysis.get('consolidated_themes', [])
            theme_success = self.store_theme_embeddings(study_id, consolidated_themes)
            
            # Store insight embeddings
            actionable_insights = complete_analysis.get('actionable_insights', [])
            insight_success = self.store_insight_embeddings(study_id, actionable_insights)
            
            success = transcript_success and theme_success and insight_success
            
            if success:
                logger.info(f"Successfully processed all embeddings for study {study_id}")
            else:
                logger.warning(f"Some embeddings failed for study {study_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to process complete analysis embeddings: {str(e)}")
            return False
