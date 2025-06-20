import os
import json
import logging
import time
from datetime import datetime 
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

# step 12
class SemanticSearchEngine:
    def __init__(self, vector_processor: VectorProcessor):
        """Initialize semantic search engine"""
        self.vector_processor = vector_processor
        self.logger = logging.getLogger(__name__)
        self.search_cache = {}  # Simple in-memory cache
    
    def search_insights_across_studies(self, query: str, context: Dict = None, limit: int = 10) -> Dict:
        """Search for insights across all studies with business context"""
        try:
            self.logger.info(f"Searching insights across studies: {query[:50]}...")
            
            # Generate query embedding
            query_embedding = self.vector_processor.generate_embedding(query)
            
            # Build search filters from context
            filters = self._build_search_filters(context)
            
            # Search insights with advanced filtering
            insight_results = self._search_insights_with_context(query_embedding, filters, limit)
            
            # Enhance results with cross-study analysis
            enhanced_results = self._enhance_cross_study_results(insight_results, query)
            
            # Cluster similar insights
            clustered_results = self._cluster_similar_insights(enhanced_results)
            
            return {
                "query": query,
                "context": context,
                "total_results": len(enhanced_results),
                "clustered_insights": clustered_results,
                "search_metadata": {
                    "studies_searched": self._get_studies_in_results(enhanced_results),
                    "similarity_range": self._get_similarity_range(enhanced_results),
                    "search_timestamp": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            self.logger.error(f"Cross-study insight search failed: {str(e)}")
            return {"error": str(e), "query": query}
    
    def _build_search_filters(self, context: Dict) -> Dict:
        """Build search filters from business context"""
        filters = {
            "similarity_threshold": 0.6,  # Default threshold
            "business_impact_filter": None,
            "timeline_filter": None,
            "study_ids": None
        }
        
        if context:
            filters.update({
                "similarity_threshold": context.get("min_similarity", 0.6),
                "business_impact_filter": context.get("business_impact"),  # high/medium/low
                "timeline_filter": context.get("timeline"),  # immediate/short-term/long-term
                "study_ids": context.get("study_ids"),  # specific studies to search
                "exclude_studies": context.get("exclude_studies")
            })
        
        return filters
    
    def _search_insights_with_context(self, query_embedding: List[float], filters: Dict, limit: int) -> List[Dict]:
        """Search insights with contextual filters"""
        try:
            # Base similarity search
            base_results = self.vector_processor.supabase.rpc(
                'match_insights',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': filters['similarity_threshold'],
                    'match_count': limit * 2,  # Get more to filter
                    'study_filter': None  # We'll filter manually for more control
                }
            ).execute()
            
            filtered_results = []
            
            for result in base_results.data:
                # Apply business impact filter
                if filters['business_impact_filter']:
                    if result.get('business_impact') != filters['business_impact_filter']:
                        continue
                
                # Apply timeline filter
                metadata = result.get('metadata', {})
                if filters['timeline_filter']:
                    if metadata.get('timeline') != filters['timeline_filter']:
                        continue
                
                # Apply study ID filters
                if filters['study_ids']:
                    if result.get('study_id') not in filters['study_ids']:
                        continue
                
                if filters.get('exclude_studies'):
                    if result.get('study_id') in filters['exclude_studies']:
                        continue
                
                filtered_results.append(result)
                
                if len(filtered_results) >= limit:
                    break
            
            return filtered_results
            
        except Exception as e:
            self.logger.error(f"Contextual insight search failed: {str(e)}")
            return []
    
    def _enhance_cross_study_results(self, results: List[Dict], original_query: str) -> List[Dict]:
        """Enhance results with cross-study analysis"""
        enhanced = []
        
        for result in results:
            try:
                # Add study context
                study_context = self._get_study_context(result.get('study_id'))
                
                # Calculate relevance score
                relevance_score = self._calculate_relevance_score(result, original_query)
                
                # Add cross-study connections
                related_insights = self._find_related_insights_in_other_studies(
                    result, 
                    exclude_study=result.get('study_id')
                )
                
                enhanced_result = {
                    **result,
                    "study_context": study_context,
                    "relevance_score": relevance_score,
                    "related_insights_count": len(related_insights),
                    "related_insights": related_insights[:3],  # Top 3 related
                    "cross_study_pattern": self._identify_cross_study_pattern(result, related_insights)
                }
                
                enhanced.append(enhanced_result)
                
            except Exception as e:
                self.logger.error(f"Failed to enhance result: {str(e)}")
                enhanced.append(result)  # Add original if enhancement fails
        
        return enhanced
    
    def _cluster_similar_insights(self, insights: List[Dict]) -> List[Dict]:
        """Cluster similar insights for better organization"""
        try:
            if len(insights) < 2:
                return [{"cluster_name": "All Results", "insights": insights, "cluster_size": len(insights)}]
            
            # Simple clustering based on similarity scores and keywords
            clusters = {}
            
            for insight in insights:
                # Extract key themes for clustering
                title = insight.get('insight_title', '').lower()
                description = insight.get('insight_description', '').lower()
                
                # Simple keyword-based clustering
                cluster_key = self._determine_cluster_key(title, description)
                
                if cluster_key not in clusters:
                    clusters[cluster_key] = {
                        "cluster_name": cluster_key.title(),
                        "insights": [],
                        "avg_similarity": 0,
                        "studies_represented": set()
                    }
                
                clusters[cluster_key]["insights"].append(insight)
                clusters[cluster_key]["studies_represented"].add(insight.get('study_id'))
            
            # Convert to list and calculate averages
            clustered_results = []
            for cluster_name, cluster_data in clusters.items():
                cluster_insights = cluster_data["insights"]
                avg_similarity = sum(i.get('similarity', 0) for i in cluster_insights) / len(cluster_insights)
                
                clustered_results.append({
                    "cluster_name": cluster_data["cluster_name"],
                    "insights": cluster_insights,
                    "cluster_size": len(cluster_insights),
                    "avg_similarity": round(avg_similarity, 3),
                    "studies_represented": len(cluster_data["studies_represented"]),
                    "cross_study_cluster": len(cluster_data["studies_represented"]) > 1
                })
            
            # Sort clusters by average similarity
            return sorted(clustered_results, key=lambda x: x["avg_similarity"], reverse=True)
            
        except Exception as e:
            self.logger.error(f"Insight clustering failed: {str(e)}")
            return [{"cluster_name": "All Results", "insights": insights, "cluster_size": len(insights)}]
    
    def _determine_cluster_key(self, title: str, description: str) -> str:
        """Determine cluster key based on content analysis"""
        text = f"{title} {description}"
        
        # Define clustering keywords
        clusters = {
            "convenience": ["convenience", "easy", "quick", "fast", "simple"],
            "security": ["security", "safe", "trust", "privacy", "protection"],
            "cost": ["cost", "price", "expensive", "cheap", "value", "money"],
            "experience": ["experience", "user", "interface", "design", "usability"],
            "adoption": ["adoption", "barrier", "resistance", "acceptance", "change"],
            "preference": ["prefer", "like", "choice", "option", "alternative"]
        }
        
        # Find best matching cluster
        best_cluster = "general"
        max_matches = 0
        
        for cluster_name, keywords in clusters.items():
            matches = sum(1 for keyword in keywords if keyword in text)
            if matches > max_matches:
                max_matches = matches
                best_cluster = cluster_name
        
        return best_cluster
    
    def find_insight_recommendations(self, insight_id: str, limit: int = 5) -> List[Dict]:
        """Find recommended insights based on a specific insight"""
        try:
            self.logger.info(f"Finding recommendations for insight {insight_id}")
            
            # Get the source insight
            source_insight = self._get_insight_by_id(insight_id)
            if not source_insight:
                return []
            
            # Create search query from insight content
            search_query = f"{source_insight.get('insight_title', '')} {source_insight.get('insight_description', '')}"
            
            # Search for similar insights
            query_embedding = self.vector_processor.generate_embedding(search_query)
            
            similar_results = self.vector_processor.supabase.rpc(
                'match_insights',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.5,
                    'match_count': limit + 1,  # +1 to exclude the source insight
                    'study_filter': None
                }
            ).execute()
            
            # Filter out the source insight and enhance results
            recommendations = []
            for result in similar_results.data:
                if result.get('id') != insight_id:  # Exclude source insight
                    # Add recommendation context
                    result['recommendation_reason'] = self._get_recommendation_reason(source_insight, result)
                    result['cross_study_connection'] = source_insight.get('study_id') != result.get('study_id')
                    recommendations.append(result)
                
                if len(recommendations) >= limit:
                    break
            
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Insight recommendations failed: {str(e)}")
            return []
    
    def search_with_business_context(self, query: str, business_scenario: str, limit: int = 8) -> Dict:
        """Search insights with specific business scenario context"""
        try:
            self.logger.info(f"Business context search: {query} | Scenario: {business_scenario}")
            
            # Enhance query with business context
            enhanced_query = f"{query} {business_scenario}"
            
            # Generate embedding for enhanced query
            query_embedding = self.vector_processor.generate_embedding(enhanced_query)
            
            # Search across all insight types
            results = self.vector_processor.supabase.rpc(
                'match_insights',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.6,
                    'match_count': limit,
                    'study_filter': None
                }
            ).execute()
            
            # Enhance results with business context scoring
            enhanced_results = []
            for result in results.data:
                business_relevance = self._score_business_relevance(result, business_scenario)
                result['business_relevance_score'] = business_relevance
                result['business_scenario'] = business_scenario
                enhanced_results.append(result)
            
            # Sort by combined similarity and business relevance
            enhanced_results.sort(
                key=lambda x: (x.get('similarity', 0) * 0.7 + x.get('business_relevance_score', 0) * 0.3), 
                reverse=True
            )
            
            return {
                "query": query,
                "business_scenario": business_scenario,
                "results": enhanced_results,
                "total_results": len(enhanced_results)
            }
            
        except Exception as e:
            self.logger.error(f"Business context search failed: {str(e)}")
            return {"error": str(e)}
    
    # Helper methods
    def _get_study_context(self, study_id: str) -> Dict:
        """Get context information about a study"""
        # This would typically fetch from your studies table
        return {
            "study_id": study_id,
            "study_type": "focus_group",  # You'd get this from your database
            "participant_count": "unknown",  # You'd get this from your database
        }
    
    def _calculate_relevance_score(self, result: Dict, query: str) -> float:
        """Calculate relevance score for a result"""
        similarity = result.get('similarity', 0)
        business_impact_weight = {"high": 1.0, "medium": 0.7, "low": 0.4}.get(result.get('business_impact', 'medium'), 0.7)
        
        return round(similarity * business_impact_weight, 3)
    
    def _find_related_insights_in_other_studies(self, insight: Dict, exclude_study: str) -> List[Dict]:
        """Find related insights in other studies"""
        try:
            query_text = f"{insight.get('insight_title', '')} {insight.get('insight_description', '')}"
            query_embedding = self.vector_processor.generate_embedding(query_text)
            
            results = self.vector_processor.supabase.rpc(
                'match_insights',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.7,
                    'match_count': 5,
                    'study_filter': None
                }
            ).execute()
            
            # Filter out the source study
            related = [r for r in results.data if r.get('study_id') != exclude_study]
            return related
            
        except Exception as e:
            self.logger.error(f"Failed to find related insights: {str(e)}")
            return []
    
    def _identify_cross_study_pattern(self, insight: Dict, related_insights: List[Dict]) -> str:
        """Identify patterns across studies"""
        if not related_insights:
            return "unique"
        
        if len(related_insights) >= 2:
            return "common_pattern"
        else:
            return "emerging_pattern"
    
    def _get_studies_in_results(self, results: List[Dict]) -> List[str]:
        """Get unique study IDs from results"""
        return list(set(r.get('study_id') for r in results if r.get('study_id')))
    
    def _get_similarity_range(self, results: List[Dict]) -> Dict:
        """Get similarity score range from results"""
        if not results:
            return {"min": 0, "max": 0}
        
        similarities = [r.get('similarity', 0) for r in results]
        return {
            "min": round(min(similarities), 3),
            "max": round(max(similarities), 3),
            "avg": round(sum(similarities) / len(similarities), 3)
        }
    
    def _get_insight_by_id(self, insight_id: str) -> Dict:
        """Get insight by ID"""
        try:
            result = self.vector_processor.supabase.table('insight_embeddings').select('*').eq('id', insight_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            self.logger.error(f"Failed to get insight by ID: {str(e)}")
            return None
    
    def _get_recommendation_reason(self, source: Dict, target: Dict) -> str:
        """Generate recommendation reason"""
        if source.get('study_id') != target.get('study_id'):
            return "Similar insight from different study"
        else:
            return "Related insight from same study"
    
    def _score_business_relevance(self, result: Dict, business_scenario: str) -> float:
        """Score business relevance for a scenario"""
        # Simple keyword matching for business relevance
        scenario_lower = business_scenario.lower()
        content = f"{result.get('insight_title', '')} {result.get('insight_description', '')}".lower()
        
        # Count relevant keywords
        relevance_keywords = scenario_lower.split()
        matches = sum(1 for keyword in relevance_keywords if keyword in content)
        
        return min(matches / len(relevance_keywords), 1.0) if relevance_keywords else 0.0
