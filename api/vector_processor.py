import os
import json
import logging
import time
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

class EmbeddingManager:
    def __init__(self, vector_processor: VectorProcessor):
        """Initialize embedding manager with vector processor"""
        self.vector_processor = vector_processor
        self.logger = logging.getLogger(__name__)
    
    def batch_process_studies(self, study_ids: List[str], force_refresh: bool = False) -> Dict:
        """Process embeddings for multiple studies in batch"""
        try:
            self.logger.info(f"Starting batch processing for {len(study_ids)} studies")
            
            results = {
                "processed_studies": [],
                "failed_studies": [],
                "total_embeddings": 0,
                "processing_time": 0
            }
            
            start_time = time.time()
            
            for study_id in study_ids:
                try:
                    self.logger.info(f"Processing embeddings for study {study_id}")
                    
                    # Check if embeddings already exist
                    if not force_refresh and self._embeddings_exist(study_id):
                        self.logger.info(f"Embeddings already exist for study {study_id}, skipping")
                        results["processed_studies"].append({
                            "study_id": study_id,
                            "status": "skipped",
                            "reason": "embeddings_exist"
                        })
                        continue
                    
                    # Get or generate analysis
                    analysis_result = self._get_study_analysis(study_id)
                    
                    # Process embeddings
                    embedding_success = self.vector_processor.process_complete_analysis(study_id, analysis_result)
                    
                    if embedding_success:
                        embedding_count = self._count_study_embeddings(study_id)
                        results["processed_studies"].append({
                            "study_id": study_id,
                            "status": "success",
                            "embeddings_created": embedding_count
                        })
                        results["total_embeddings"] += embedding_count
                    else:
                        results["failed_studies"].append({
                            "study_id": study_id,
                            "error": "embedding_processing_failed"
                        })
                    
                except Exception as e:
                    self.logger.error(f"Failed to process study {study_id}: {str(e)}")
                    results["failed_studies"].append({
                        "study_id": study_id,
                        "error": str(e)
                    })
            
            results["processing_time"] = time.time() - start_time
            
            self.logger.info(f"Batch processing completed: {len(results['processed_studies'])} successful, {len(results['failed_studies'])} failed")
            
            return results
            
        except Exception as e:
            self.logger.error(f"Batch processing failed: {str(e)}")
            raise
    
    def _embeddings_exist(self, study_id: str) -> bool:
        """Check if embeddings already exist for a study"""
        try:
            # Check transcript embeddings
            transcript_result = self.vector_processor.supabase.table('transcript_embeddings').select('id').eq('study_id', study_id).limit(1).execute()
            
            # Check theme embeddings
            theme_result = self.vector_processor.supabase.table('theme_embeddings').select('id').eq('study_id', study_id).limit(1).execute()
            
            return len(transcript_result.data) > 0 or len(theme_result.data) > 0
            
        except Exception as e:
            self.logger.error(f"Failed to check existing embeddings: {str(e)}")
            return False
    
    def _count_study_embeddings(self, study_id: str) -> int:
        """Count total embeddings for a study"""
        try:
            transcript_count = len(self.vector_processor.supabase.table('transcript_embeddings').select('id').eq('study_id', study_id).execute().data)
            theme_count = len(self.vector_processor.supabase.table('theme_embeddings').select('id').eq('study_id', study_id).execute().data)
            insight_count = len(self.vector_processor.supabase.table('insight_embeddings').select('id').eq('study_id', study_id).execute().data)
            
            return transcript_count + theme_count + insight_count
            
        except Exception as e:
            self.logger.error(f"Failed to count embeddings: {str(e)}")
            return 0
    
    def advanced_similarity_search(self, query: str, search_type: str = "all", filters: Dict = None, limit: int = 10) -> Dict:
        """Advanced similarity search with filtering and ranking"""
        try:
            self.logger.info(f"Advanced similarity search: {query[:50]}... (type: {search_type})")
            
            # Generate query embedding
            query_embedding = self.vector_processor.generate_embedding(query)
            
            results = {
                "query": query,
                "search_type": search_type,
                "results": []
            }
            
            # Search themes
            if search_type in ["all", "themes"]:
                theme_results = self._search_themes_advanced(query_embedding, filters, limit)
                results["results"].extend([{**r, "type": "theme"} for r in theme_results])
            
            # Search insights
            if search_type in ["all", "insights"]:
                insight_results = self._search_insights_advanced(query_embedding, filters, limit)
                results["results"].extend([{**r, "type": "insight"} for r in insight_results])
            
            # Search transcripts
            if search_type in ["all", "transcripts"]:
                transcript_results = self._search_transcripts_advanced(query_embedding, filters, limit)
                results["results"].extend([{**r, "type": "transcript"} for r in transcript_results])
            
            # Sort by similarity and limit
            results["results"] = sorted(results["results"], key=lambda x: x.get("similarity", 0), reverse=True)[:limit]
            
            self.logger.info(f"Found {len(results['results'])} similar items")
            
            return results
            
        except Exception as e:
            self.logger.error(f"Advanced similarity search failed: {str(e)}")
            return {"query": query, "results": [], "error": str(e)}
    
    def _search_themes_advanced(self, query_embedding: List[float], filters: Dict, limit: int) -> List[Dict]:
        """Advanced theme search with filters"""
        try:
            query_params = {
                'query_embedding': query_embedding,
                'match_threshold': filters.get('similarity_threshold', 0.7) if filters else 0.7,
                'match_count': limit,
                'study_filter': filters.get('study_id') if filters else None
            }
            
            result = self.vector_processor.supabase.rpc('match_themes', query_params).execute()
            
            return result.data
            
        except Exception as e:
            self.logger.error(f"Theme search failed: {str(e)}")
            return []
    
    def _search_insights_advanced(self, query_embedding: List[float], filters: Dict, limit: int) -> List[Dict]:
        """Advanced insight search with filters"""
        try:
            query_params = {
                'query_embedding': query_embedding,
                'match_threshold': filters.get('similarity_threshold', 0.7) if filters else 0.7,
                'match_count': limit,
                'study_filter': filters.get('study_id') if filters else None
            }
            
            result = self.vector_processor.supabase.rpc('match_insights', query_params).execute()
            
            return result.data
            
        except Exception as e:
            self.logger.error(f"Insight search failed: {str(e)}")
            return []
    
    def _search_transcripts_advanced(self, query_embedding: List[float], filters: Dict, limit: int) -> List[Dict]:
        """Advanced transcript search with filters"""
        try:
            # For now, use direct similarity search since we don't have a stored function yet
            # You can add a match_transcripts function similar to match_themes
            
            query_builder = self.vector_processor.supabase.table('transcript_embeddings').select('*')
            
            if filters and filters.get('study_id'):
                query_builder = query_builder.eq('study_id', filters['study_id'])
            
            # This is a simplified version - in production you'd want the RPC function
            result = query_builder.limit(limit).execute()
            
            return result.data[:limit]  # Simplified for now
            
        except Exception as e:
            self.logger.error(f"Transcript search failed: {str(e)}")
            return []
    
    def update_study_embeddings(self, study_id: str, updated_analysis: Dict) -> bool:
        """Update embeddings when analysis changes"""
        try:
            self.logger.info(f"Updating embeddings for study {study_id}")
            
            # Delete existing embeddings
            self._delete_study_embeddings(study_id)
            
            # Create new embeddings
            success = self.vector_processor.process_complete_analysis(study_id, updated_analysis)
            
            if success:
                self.logger.info(f"Successfully updated embeddings for study {study_id}")
            else:
                self.logger.error(f"Failed to update embeddings for study {study_id}")
            
            return success
            
        except Exception as e:
            self.logger.error(f"Failed to update embeddings: {str(e)}")
            return False
    
    def _delete_study_embeddings(self, study_id: str):
        """Delete all embeddings for a study"""
        try:
            # Delete from all embedding tables
            self.vector_processor.supabase.table('transcript_embeddings').delete().eq('study_id', study_id).execute()
            self.vector_processor.supabase.table('theme_embeddings').delete().eq('study_id', study_id).execute()
            self.vector_processor.supabase.table('insight_embeddings').delete().eq('study_id', study_id).execute()
            
            self.logger.info(f"Deleted existing embeddings for study {study_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to delete embeddings: {str(e)}")
            raise
    
    def get_embedding_statistics(self) -> Dict:
        """Get statistics about stored embeddings"""
        try:
            stats = {}
            
            # Count embeddings by type
            transcript_count = len(self.vector_processor.supabase.table('transcript_embeddings').select('id').execute().data)
            theme_count = len(self.vector_processor.supabase.table('theme_embeddings').select('id').execute().data)
            insight_count = len(self.vector_processor.supabase.table('insight_embeddings').select('id').execute().data)
            
            # Count unique studies
            transcript_studies = set([r['study_id'] for r in self.vector_processor.supabase.table('transcript_embeddings').select('study_id').execute().data])
            theme_studies = set([r['study_id'] for r in self.vector_processor.supabase.table('theme_embeddings').select('study_id').execute().data])
            insight_studies = set([r['study_id'] for r in self.vector_processor.supabase.table('insight_embeddings').select('study_id').execute().data])
            
            all_studies = transcript_studies.union(theme_studies).union(insight_studies)
            
            stats = {
                "total_embeddings": transcript_count + theme_count + insight_count,
                "transcript_embeddings": transcript_count,
                "theme_embeddings": theme_count,
                "insight_embeddings": insight_count,
                "unique_studies": len(all_studies),
                "studies_with_embeddings": list(all_studies)
            }
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Failed to get embedding statistics: {str(e)}")
            return {"error": str(e)}
    
    def _get_study_analysis(self, study_id: str) -> Dict:
        """Get existing analysis for a study"""
        try:
            # Import here to avoid circular imports
            import inspect
            
            # Check if we're already in an async context
            try:
                import asyncio
                loop = asyncio.get_running_loop()
                # We're in an async context, can't create new loop
                raise Exception("Cannot generate analysis in async context - analysis should be pre-generated")
            except RuntimeError:
                # No running loop, we can create one
                from main import analyze_complete_transcript_internal
                import asyncio
                
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    return loop.run_until_complete(analyze_complete_transcript_internal(study_id))
                finally:
                    loop.close()
                    
        except Exception as e:
            self.logger.error(f"Failed to get study analysis: {str(e)}")
            raise Exception(f"Analysis retrieval failed: {str(e)}")

