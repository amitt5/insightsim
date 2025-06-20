import os
from dotenv import load_dotenv
from typing import List, Dict, Optional, Union
from dataclasses import dataclass
import json
from fastapi import HTTPException

# OpenAI integration through LlamaIndex
from openai import OpenAI
from llama_index.core.llms import ChatMessage, MessageRole
import logging
import traceback
from datetime import datetime


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@dataclass
class ThemeData:
    """Structure for extracted themes"""
    theme_name: str
    description: str
    frequency: int
    key_points: List[str]
    related_quotes: List[str]

@dataclass
class PatternData:
    """Structure for extracted patterns"""
    pattern_type: str
    pattern_name: str
    description: str
    frequency: int
    participants_involved: List[str]
    supporting_examples: List[str]
    confidence_score: str

@dataclass
class QuoteData:
    """Structure for extracted quotes"""
    quote_text: str
    speaker: str
    context: str
    theme_relevance: str
    sentiment: str

@dataclass
class InsightData:
    """Structure for generated insights"""
    insight_title: str
    insight_description: str
    supporting_evidence: List[str]
    implications: str
    confidence_level: str

class LLMAnalyzer:
    """Handle LLM-based analysis of transcript chunks"""
    
    def __init__(self):
        """Initialize the LLM analyzer with OpenAI configuration"""

        load_dotenv()

        # Debug: Check if API key is loaded
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("ERROR: OPENAI_API_KEY not found in environment")
        else:
            print(f"DEBUG: OpenAI API Key loaded: {api_key[:10]}...")
        
        # This line uses the new OpenAI import
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-3.5-turbo"
        self.temperature = 0.3
        self.max_tokens = 1500
        # Initialize OpenAI LLM through LlamaIndex
        # self.llm = OpenAI(
        #     model="gpt-3.5-turbo",
        #     temperature=0.3,  # Lower temperature for more consistent analysis
        #     max_tokens=1500,
        #     api_key=api_key
        # )
        
        # Analysis prompts for different tasks
        self.theme_extraction_prompt = """
        Analyze the following focus group transcript chunk and extract key themes related to consumer behavior and shopping preferences.

        For each theme you identify, provide:
        1. Theme name (concise, descriptive)
        2. Brief description of the theme
        3. Key points that support this theme
        4. Relevant quotes that illustrate the theme

        Focus on themes related to:
        - Shopping preferences (online vs in-store)
        - Decision-making factors
        - Pain points and frustrations
        - Convenience and time factors
        - Price and value considerations
        - Technology adoption
        - Future shopping trends

        Transcript chunk:
        {chunk_text}

        Respond in JSON format with this structure:
        {
            "themes": [
                {
                    "theme_name": "string",
                    "description": "string",
                    "key_points": ["string"],
                    "related_quotes": ["string"]
                }
            ]
        }
        """
        
        self.pattern_analysis_prompt = """
        Analyze the following focus group transcript chunk and identify behavioral patterns, decision-making patterns, and demographic patterns.

        Look for:
        1. BEHAVIORAL PATTERNS - How participants consistently act or make decisions
        2. DEMOGRAPHIC PATTERNS - Differences between age groups, genders, or other segments
        3. FREQUENCY PATTERNS - Topics, concerns, or behaviors mentioned repeatedly
        4. SENTIMENT PATTERNS - How emotions/attitudes change across different topics
        5. DECISION PATTERNS - Common processes people follow when making choices
        6. TEMPORAL PATTERNS - How behaviors change based on time/situation
        7. CORRELATION PATTERNS - Topics or behaviors that consistently appear together

        For each pattern, provide:
        1. Pattern type (behavioral, demographic, frequency, sentiment, decision, temporal, correlation)
        2. Pattern name (concise, descriptive)
        3. Description of the pattern
        4. How frequently it appears
        5. Which participants exhibit this pattern
        6. Supporting examples from the text
        7. Confidence level (high, medium, low)

        Transcript chunk:
        {chunk_text}

        Respond in JSON format with this structure:
        {
            "patterns": [
                {
                    "pattern_type": "string",
                    "pattern_name": "string", 
                    "description": "string",
                    "frequency": "string",
                    "participants_involved": ["string"],
                    "supporting_examples": ["string"],
                    "confidence_score": "string"
                }
            ]
        }
        """

        self.quote_extraction_prompt = """
        Analyze the following focus group transcript chunk and extract the most significant and insightful quotes.

        For each quote, identify:
        1. The exact quote text
        2. The speaker (Moderator, Participant 1, etc.)
        3. Context of the quote
        4. What theme or topic it relates to
        5. Sentiment (positive, negative, neutral, mixed)

        Focus on quotes that:
        - Reveal important insights about consumer behavior
        - Express strong opinions or preferences
        - Illustrate key pain points or benefits
        - Show interesting perspectives or contradictions
        - Demonstrate decision-making processes

        Transcript chunk:
        {chunk_text}

        Respond in JSON format with this structure:
        {
            "quotes": [
                {
                    "quote_text": "string",
                    "speaker": "string",
                    "context": "string",
                    "theme_relevance": "string",
                    "sentiment": "string"
                }
            ]
        }
        """
        
        self.insight_generation_prompt = """
        Based on the following focus group transcript chunk, generate actionable consumer insights that would be valuable for market research.

        For each insight, provide:
        1. Insight title (clear, actionable)
        2. Detailed description of the insight
        3. Supporting evidence from the transcript
        4. Business implications or recommendations
        5. Confidence level (high, medium, low)

        Focus on insights about:
        - Consumer behavior patterns
        - Shopping preference drivers
        - Unmet needs or opportunities
        - Barriers to adoption
        - Demographic differences
        - Future trends and predictions

        Transcript chunk:
        {chunk_text}

        Respond in JSON format with this structure:
        {
            "insights": [
                {
                    "insight_title": "string",
                    "insight_description": "string",
                    "supporting_evidence": ["string"],
                    "implications": "string",
                    "confidence_level": "string"
                }
            ]
        }
        """

    def analyze_chunk_themes(self, chunk_text: str, chunk_id: str) -> Dict:
        """Extract themes from a single chunk with robust JSON parsing"""
        
        # Simplified, more focused prompt
        system_prompt = """You are a qualitative market research analyst. 
        Analyze the transcript chunk and extract themes related to consumer behavior and shopping preferences.
        You must respond with valid JSON only, no additional text.
        
        Return this exact JSON structure:
        {
            "themes": [
                {
                    "theme_name": "string",
                    "description": "string", 
                    "key_points": ["string"],
                    "related_quotes": ["string"]
                }
            ]
        }"""
        
        try:
            logger.info(f"Starting analysis for chunk {chunk_id}")
            logger.debug(f"Chunk text length: {len(chunk_text)}")
            
          
            logger.debug(f"Making OpenAI API call for chunk {chunk_id}")

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze this transcript chunk:\n\n{chunk_text}"}
                ],
                response_format={"type": "json_object"},  # This is crucial
                temperature=0.3,
                max_tokens=1500
            )
            logger.debug(f"Received OpenAI response for chunk {chunk_id}")
            # Extract and clean the response
            raw_content = response.choices[0].message.content
            logger.debug(f"Raw OpenAI response: {raw_content[:200]}...")
            logger.debug(f"About to clean JSON response for chunk {chunk_id}")

            cleaned_json = self._clean_json_response(raw_content)
            logger.debug(f"Cleaned JSON: {cleaned_json[:200]}...")
            logger.debug(f"About to parse JSON for chunk {chunk_id}")

            result = json.loads(cleaned_json)
            logger.debug(f"Successfully parsed JSON for chunk {chunk_id}")
            
            # Add metadata
            result["chunk_id"] = chunk_id
            result["analysis_type"] = "themes"
            
            logger.debug(f"About to return result for chunk {chunk_id}")
        
            logger.info(f"Successfully analyzed chunk {chunk_id}")
            return result
            
        except json.JSONDecodeError as e:
            error_msg = f"JSON parsing error for chunk {chunk_id}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Raw response that failed to parse: {raw_content}")
            return self._create_fallback_response(chunk_id, "themes", error_msg)
        
        except Exception as e:
            error_msg = f"Unexpected error analyzing chunk {chunk_id}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return self._create_fallback_response(chunk_id, "themes", error_msg)

    
# Update your analyze_single_chunk method to include patterns (around line 210)
    def analyze_single_chunk(self, chunk_data: Dict, analysis_types: List[str] = None) -> Dict:
        logger.info(f"Analyzing single chunk11 {chunk_data['chunk_index']} for study {chunk_data['study_id']}")
        
        """Perform comprehensive analysis on a single chunk"""
        if analysis_types is None:
            analysis_types = ["themes", "quotes", "insights", "patterns"]  # Add patterns here
        
        chunk_text = chunk_data["text"]
        chunk_id = chunk_data["chunk_id"]

        logger.info(f"Chunk text length: {len(chunk_text)}")
        logger.info(f"Chunk id: {chunk_id}")
        
        results = {
            "chunk_id": chunk_id,
            "chunk_index": chunk_data["chunk_index"],
            "analysis_results": {}
        }
        
        # Perform requested analyses
        if "themes" in analysis_types:
            results["analysis_results"]["themes"] = self.analyze_chunk_themes(chunk_text, chunk_id)
            logger.info(f"Themes Results: {results}")

        if "quotes" in analysis_types:
            results["analysis_results"]["quotes"] = self.analyze_chunk_quotes(chunk_text, chunk_id)
            logger.info(f"Quotes Results: {results}")

        if "insights" in analysis_types:
            results["analysis_results"]["insights"] = self.analyze_chunk_insights(chunk_text, chunk_id)
            logger.info(f"Insights Results: {results}")
            
        if "patterns" in analysis_types:  # Add this new condition
            results["analysis_results"]["patterns"] = self.analyze_chunk_patterns(chunk_text, chunk_id)
            logger.info(f"Patterns Results: {results}")
            
        logger.info(f"Results: {results}")
        return results
    
    def analyze_chunk_quotes(self, chunk_text: str, chunk_id: str) -> Dict:
        """Extract significant quotes from a single chunk"""
        
        system_prompt = """You are a qualitative market research analyst.
        Extract the most significant quotes from this transcript chunk.
        You must respond with valid JSON only, no additional text.
        
        Return this exact JSON structure:
        {
            "quotes": [
                {
                    "quote_text": "string",
                    "speaker": "string", 
                    "context": "string",
                    "theme_relevance": "string",
                    "sentiment": "string"
                }
            ]
        }"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Extract quotes from:\n\n{chunk_text}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1500
            )
            
            raw_content = response.choices[0].message.content
            cleaned_json = self._clean_json_response(raw_content)
            result = json.loads(cleaned_json)
            
            result["chunk_id"] = chunk_id
            result["analysis_type"] = "quotes"
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error for chunk {chunk_id}: {e}")
            return self._create_fallback_response(chunk_id, "quotes", str(e))
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Quote analysis failed for chunk {chunk_id}: {str(e)}"
            )

    def analyze_chunk_patterns(self, chunk_text: str, chunk_id: str) -> Dict:
        """Extract behavioral and demographic patterns from a single chunk"""
        try:
            logger.info(f"Starting pattern analysis for chunk {chunk_id}")
            logger.debug(f"Chunk text length: {len(chunk_text)}")
            
            system_prompt = """You are a qualitative market research analyst.
            Extract behavioral and demographic patterns from this transcript chunk.
            You must respond with valid JSON only, no additional text.
            
            Return this exact JSON structure:
            {
                "patterns": [
                    {
                        "pattern_type": "behavioral/demographic/preference",
                        "pattern_name": "string",
                        "description": "string",
                        "frequency": "high/medium/low",
                        "demographic_segments": ["string"],
                        "supporting_evidence": ["string"]
                    }
                ]
            }"""
            
            logger.debug(f"Making OpenAI API call for pattern analysis - chunk {chunk_id}")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Extract patterns from this transcript chunk:\n\n{chunk_text}"}
                ],
                response_format={"type": "json_object"},
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            logger.debug(f"Received OpenAI response for pattern analysis - chunk {chunk_id}")
            
            # Extract and clean the response
            raw_content = response.choices[0].message.content
            logger.debug(f"Raw pattern response: {raw_content[:200]}...")
            
            logger.debug(f"About to clean JSON response for patterns - chunk {chunk_id}")
            cleaned_json = self._clean_json_response(raw_content)
            
            logger.debug(f"About to parse JSON for patterns - chunk {chunk_id}")
            result = json.loads(cleaned_json)
            
            # Add metadata
            result["chunk_id"] = chunk_id
            result["analysis_type"] = "patterns"
            
            logger.info(f"Successfully analyzed patterns for chunk {chunk_id}")
            logger.debug(f"Pattern result keys: {result.keys()}")
            
            return result
        
        except json.JSONDecodeError as e:
            error_msg = f"JSON parsing error for patterns chunk {chunk_id}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Raw response that failed to parse: {raw_content}")
            return self._create_fallback_response(chunk_id, "patterns", error_msg)
            
        except Exception as e:
            error_msg = f"Pattern analysis failed for chunk {chunk_id}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return self._create_fallback_response(chunk_id, "patterns", error_msg)


    def analyze_chunk_insights(self, chunk_text: str, chunk_id: str) -> Dict:
        """Generate insights from a single chunk"""
        try:
            logger.info(f"Starting insight analysis for chunk {chunk_id}")
            logger.debug(f"Chunk text length: {len(chunk_text)}")
            
            system_prompt = """You are a qualitative market research analyst.
            Generate key insights from this transcript chunk about consumer behavior and preferences.
            You must respond with valid JSON only, no additional text.
            
            Return this exact JSON structure:
            {
                "insights": [
                    {
                        "insight_text": "string",
                        "insight_type": "behavioral/preference/demographic/trend",
                        "confidence_level": "high/medium/low",
                        "supporting_quotes": ["string"],
                        "business_implications": "string",
                        "actionable_recommendations": ["string"]
                    }
                ]
            }"""
            
            logger.debug(f"Making OpenAI API call for insight analysis - chunk {chunk_id}")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate insights from this transcript chunk:\n\n{chunk_text}"}
                ],
                response_format={"type": "json_object"},
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            logger.debug(f"Received OpenAI response for insight analysis - chunk {chunk_id}")
            
            # Extract and clean the response
            raw_content = response.choices[0].message.content
            logger.debug(f"Raw insight response: {raw_content[:200]}...")
            
            logger.debug(f"About to clean JSON response for insights - chunk {chunk_id}")
            cleaned_json = self._clean_json_response(raw_content)
            
            logger.debug(f"About to parse JSON for insights - chunk {chunk_id}")
            result = json.loads(cleaned_json)
            
            # Add metadata
            result["chunk_id"] = chunk_id
            result["analysis_type"] = "insights"
            
            logger.info(f"Successfully analyzed insights for chunk {chunk_id}")
            logger.debug(f"Insight result keys: {result.keys()}")
            
            return result
        
        except json.JSONDecodeError as e:
            error_msg = f"JSON parsing error for insights chunk {chunk_id}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Raw response that failed to parse: {raw_content}")
            return self._create_fallback_response(chunk_id, "insights", error_msg)
            
        except Exception as e:
            error_msg = f"Insight analysis failed for chunk {chunk_id}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return self._create_fallback_response(chunk_id, "insights", error_msg)


    def analyze_study_chunks(self, chunks_data: Dict, analysis_types: List[str] = None) -> Dict:
        """Analyze all chunks in a study"""
        study_id = chunks_data["study_id"]
        chunks = chunks_data["chunks"]
        
        if analysis_types is None:
            analysis_types = ["themes", "quotes", "insights", "patterns"]
        
        # Analyze each chunk
        chunk_analyses = []
        for chunk in chunks:
            try:
                chunk_analysis = self.analyze_single_chunk(chunk, analysis_types)
                chunk_analyses.append(chunk_analysis)
            except Exception as e:
                # Log error but continue with other chunks
                print(f"Error analyzing chunk {chunk['chunk_id']}: {str(e)}")
                continue
        
        # Aggregate results across all chunks
        aggregated_results = self.aggregate_analysis_results(chunk_analyses, study_id)
        
        return {
            "study_id": study_id,
            "total_chunks_analyzed": len(chunk_analyses),
            "analysis_types": analysis_types,
            "chunk_analyses": chunk_analyses,
            "aggregated_results": aggregated_results
        }
    
    def aggregate_analysis_results(self, chunk_analyses: List[Dict], study_id: str) -> Dict:
        """Aggregate analysis results across all chunks"""
        all_themes = []
        all_quotes = []
        all_insights = []
        all_patterns = []  

        # Collect all results
        for chunk_analysis in chunk_analyses:
            results = chunk_analysis.get("analysis_results", {})
            
            if "themes" in results and "themes" in results["themes"]:
                all_themes.extend(results["themes"]["themes"])
            
            if "quotes" in results and "quotes" in results["quotes"]:
                all_quotes.extend(results["quotes"]["quotes"])
            
            if "insights" in results and "insights" in results["insights"]:
                all_insights.extend(results["insights"]["insights"])

            if "patterns" in results and "patterns" in results["patterns"]:
                all_patterns.extend(results["patterns"]["patterns"])

        return {
            "study_id": study_id,
            "summary_statistics": {
                "total_themes": len(all_themes),
                "total_quotes": len(all_quotes),
                "total_insights": len(all_insights),
                "total_patterns": len(all_patterns),
                "chunks_processed": len(chunk_analyses)
            },
            "all_themes": all_themes,
            "all_quotes": all_quotes,
            "all_insights": all_insights,
            "all_patterns": all_patterns     
        }

    def analyze_complete_transcript(self, study_id: str, all_chunk_results: List[Dict]) -> Dict:
        """Generate comprehensive analysis of complete transcript"""
        try:
            logger.info(f"Starting complete transcript analysis for study {study_id}")
            
            # Aggregate all chunk data
            aggregated_data = self._aggregate_chunk_results(all_chunk_results)
            
            # Generate executive summary
            executive_summary = self._generate_executive_summary(aggregated_data, study_id)
            
            # Consolidate themes
            consolidated_themes = self._consolidate_themes(aggregated_data['all_themes'])
            
            # Organize quotes by themes
            organized_quotes = self._organize_quotes_by_themes(
                aggregated_data['all_quotes'], 
                consolidated_themes
            )
            
            # Generate actionable insights
            actionable_insights = self._generate_actionable_insights(
                consolidated_themes, 
                organized_quotes
            )
            
            return {
                "study_id": study_id,
                "analysis_type": "complete_transcript",
                "executive_summary": executive_summary,
                "consolidated_themes": consolidated_themes,
                "organized_quotes": organized_quotes,
                "actionable_insights": actionable_insights,
                "metadata": {
                    "total_chunks": len(all_chunk_results),
                    "successful_chunks": len([r for r in all_chunk_results if not r.get('error', False)]),
                    "analysis_timestamp": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Complete transcript analysis failed: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Transcript analysis failed: {str(e)}")

    def _aggregate_chunk_results(self, chunk_results: List[Dict]) -> Dict:
        """Aggregate data from all chunk analyses"""
        logger.info("Aggregating chunk results")
        
        all_themes = []
        all_quotes = []
        all_insights = []
        all_patterns = []
        
        for chunk_result in chunk_results:
            if not chunk_result.get('error', False):
                # Extract themes
                if 'themes' in chunk_result:
                    for theme in chunk_result['themes']:
                        theme['source_chunk'] = chunk_result.get('chunk_id', 'unknown')
                        all_themes.append(theme)
                
                # Extract quotes
                if 'quotes' in chunk_result:
                    for quote in chunk_result['quotes']:
                        quote['source_chunk'] = chunk_result.get('chunk_id', 'unknown')
                        all_quotes.append(quote)
                
                # Extract insights
                if 'insights' in chunk_result:
                    for insight in chunk_result['insights']:
                        insight['source_chunk'] = chunk_result.get('chunk_id', 'unknown')
                        all_insights.append(insight)
                
                # Extract patterns
                if 'patterns' in chunk_result:
                    for pattern in chunk_result['patterns']:
                        pattern['source_chunk'] = chunk_result.get('chunk_id', 'unknown')
                        all_patterns.append(pattern)
        
        logger.info(f"Aggregated: {len(all_themes)} themes, {len(all_quotes)} quotes, {len(all_insights)} insights, {len(all_patterns)} patterns")
        
        return {
            'all_themes': all_themes,
            'all_quotes': all_quotes,
            'all_insights': all_insights,
            'all_patterns': all_patterns
        }

    def _generate_executive_summary(self, aggregated_data: Dict, study_id: str) -> Dict:
        """Generate executive summary using OpenAI"""
        logger.info("Generating executive summary")
        
        # Prepare summary of key findings for OpenAI
        summary_input = {
            "total_themes": len(aggregated_data['all_themes']),
            "total_quotes": len(aggregated_data['all_quotes']),
            "key_themes": [theme.get('theme_name', '') for theme in aggregated_data['all_themes'][:10]],
            "sample_quotes": [quote.get('quote_text', '')[:100] for quote in aggregated_data['all_quotes'][:5]]
        }
        
        system_prompt = """You are a senior market research analyst creating an executive summary.
        Based on the focus group analysis data provided, create a comprehensive executive summary.
        You must respond with valid JSON only, no additional text.
        
        Return this exact JSON structure:
        {
            "executive_summary": {
                "overview": "string - 2-3 sentence overview of the research",
                "key_findings": ["string - top 5 key findings"],
                "participant_sentiment": "overall positive/negative/mixed sentiment",
                "primary_themes": ["string - top 3 most important themes"],
                "business_implications": ["string - 3-5 business implications"],
                "recommendations": ["string - 3-5 actionable recommendations"]
            }
        }"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Create executive summary from this focus group data:\n\n{json.dumps(summary_input, indent=2)}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=2000
            )
            
            raw_content = response.choices[0].message.content
            cleaned_json = self._clean_json_response(raw_content)
            result = json.loads(cleaned_json)
            
            logger.info("Successfully generated executive summary")
            return result.get('executive_summary', {})
            
        except Exception as e:
            logger.error(f"Executive summary generation failed: {str(e)}")
            return {
                "overview": "Executive summary generation failed",
                "key_findings": ["Manual review required"],
                "participant_sentiment": "unknown",
                "primary_themes": ["Analysis error"],
                "business_implications": ["Review required"],
                "recommendations": ["Reprocess transcript"]
            }

    def _consolidate_themes(self, all_themes: List[Dict]) -> List[Dict]:
        """Consolidate and rank themes by frequency and importance"""
        logger.info("Consolidating themes")
        
        # Group similar themes
        theme_groups = {}
        for theme in all_themes:
            theme_name = theme.get('theme_name', 'Unknown')
            
            if theme_name not in theme_groups:
                theme_groups[theme_name] = {
                    'theme_name': theme_name,
                    'frequency': 0,
                    'descriptions': [],
                    'key_points': [],
                    'related_quotes': [],
                    'source_chunks': []
                }
            
            theme_groups[theme_name]['frequency'] += 1
            theme_groups[theme_name]['descriptions'].append(theme.get('description', ''))
            theme_groups[theme_name]['key_points'].extend(theme.get('key_points', []))
            theme_groups[theme_name]['related_quotes'].extend(theme.get('related_quotes', []))
            theme_groups[theme_name]['source_chunks'].append(theme.get('source_chunk', ''))
        
        # Convert to list and sort by frequency
        consolidated = list(theme_groups.values())
        consolidated.sort(key=lambda x: x['frequency'], reverse=True)
        
        logger.info(f"Consolidated {len(all_themes)} themes into {len(consolidated)} unique themes")
        return consolidated[:10]  # Return top 10 themes

    def _organize_quotes_by_themes(self, all_quotes: List[Dict], consolidated_themes: List[Dict]) -> Dict:
        """Organize quotes by themes for better presentation"""
        logger.info("Organizing quotes by themes")
        
        organized = {}
        
        for theme in consolidated_themes:
            theme_name = theme.get('theme_name', 'Unknown')
            organized[theme_name] = {
                'theme_info': theme,
                'related_quotes': []
            }
        
        # Match quotes to themes
        for quote in all_quotes:
            quote_text = quote.get('quote_text', '').lower()
            best_match = None
            
            # Simple keyword matching to assign quotes to themes
            for theme in consolidated_themes:
                theme_name = theme.get('theme_name', '')
                theme_keywords = theme.get('key_points', [])
                
                # Check if quote relates to this theme
                for keyword in theme_keywords:
                    if keyword.lower() in quote_text:
                        best_match = theme_name
                        break
                
                if best_match:
                    break
            
            # Add quote to best matching theme or "Other"
            if best_match and best_match in organized:
                organized[best_match]['related_quotes'].append(quote)
            else:
                if 'Other' not in organized:
                    organized['Other'] = {'theme_info': {'theme_name': 'Other'}, 'related_quotes': []}
                organized['Other']['related_quotes'].append(quote)
        
        logger.info(f"Organized {len(all_quotes)} quotes across {len(organized)} themes")
        return organized

    def _generate_actionable_insights(self, consolidated_themes: List[Dict], organized_quotes: Dict) -> List[Dict]:
        """Generate actionable business insights using OpenAI"""
        logger.info("Generating actionable insights")
        
        # Prepare data for OpenAI
        insights_input = {
            "top_themes": [theme.get('theme_name', '') for theme in consolidated_themes[:5]],
            "theme_frequencies": [theme.get('frequency', 0) for theme in consolidated_themes[:5]],
            "sample_quotes": []
        }
        
        # Add sample quotes from each theme
        for theme_name, theme_data in list(organized_quotes.items())[:3]:
            quotes = theme_data.get('related_quotes', [])[:2]
            for quote in quotes:
                insights_input['sample_quotes'].append(quote.get('quote_text', ''))
        
        system_prompt = """You are a senior business consultant analyzing market research data.
        Generate actionable business insights and recommendations based on the focus group themes and quotes.
        You must respond with valid JSON only, no additional text.
        
        Return this exact JSON structure:
        {
            "actionable_insights": [
                {
                    "insight_title": "string",
                    "insight_description": "string",
                    "business_impact": "high/medium/low",
                    "recommended_actions": ["string"],
                    "timeline": "immediate/short-term/long-term",
                    "success_metrics": ["string"]
                }
            ]
        }"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate actionable insights from this research data:\n\n{json.dumps(insights_input, indent=2)}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=2000
            )
            
            raw_content = response.choices[0].message.content
            cleaned_json = self._clean_json_response(raw_content)
            result = json.loads(cleaned_json)
            
            logger.info("Successfully generated actionable insights")
            return result.get('actionable_insights', [])
            
        except Exception as e:
            logger.error(f"Actionable insights generation failed: {str(e)}")
            return [{
                "insight_title": "Analysis Error",
                "insight_description": f"Failed to generate insights: {str(e)}",
                "business_impact": "unknown",
                "recommended_actions": ["Manual review required"],
                "timeline": "immediate",
                "success_metrics": ["Review completion"]
            }]

    async def analyze_cross_transcript_patterns(self, study_ids: List[str], get_chunks_func) -> Dict:
        """Analyze patterns across multiple transcripts"""
        try:
            logger.info(f"Starting cross-transcript analysis for {len(study_ids)} studies")
            
            # Get individual analyses for each study
            all_study_analyses = []
            for study_id in study_ids:
                try:
                    # Get existing analysis or generate new one
                    logger.info(f"Getting analysis for study {study_id}")
                    study_analysis = await self._get_or_generate_study_analysis(study_id, get_chunks_func)
                    logger.info(f"Study analysis: {study_analysis}")
                    study_analysis['study_id'] = study_id
                    all_study_analyses.append(study_analysis)
                    logger.info(f"Loaded analysis for study {study_id}")
                except Exception as e:
                    logger.error(f"Failed to load analysis for study {study_id}: {str(e)}")
                    continue
            
            if not all_study_analyses:
                raise ValueError("No valid study analyses found")
            
            # Cross-transcript analysis
            cross_themes = self._analyze_cross_themes(all_study_analyses)
            demographic_patterns = self._analyze_demographic_patterns(all_study_analyses)
            consensus_analysis = self._analyze_consensus_vs_divergence(all_study_analyses)
            trend_analysis = self._analyze_trends_across_studies(all_study_analyses)
            meta_insights = self._generate_meta_insights(all_study_analyses)
            
            return {
                "analysis_type": "cross_transcript",
                "studies_analyzed": study_ids,
                "cross_themes": cross_themes,
                "demographic_patterns": demographic_patterns,
                "consensus_analysis": consensus_analysis,
                "trend_analysis": trend_analysis,
                "meta_insights": meta_insights,
                "metadata": {
                    "total_studies": len(study_ids),
                    "successful_analyses": len(all_study_analyses),
                    "analysis_timestamp": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Cross-transcript analysis failed: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Cross-transcript analysis failed: {str(e)}")

    async def _get_or_generate_study_analysis(self, study_id: str, get_chunks_func) -> Dict:
        """Get existing analysis or generate new one for a study"""
        try:
            # Try to load existing analysis (you might store these)
            # For now, generate fresh analysis
            logger.info(f"Getting chunks111 for study {study_id}")
            study_chunks = await get_chunks_func(study_id)  # Your existing function
            chunks = study_chunks["chunks"]
            logger.info(f"Chunks111: {chunks}")
            chunk_results = []
            for i, chunk in enumerate(chunks):
                # Get chunk text properly based on your structure
                logger.info(f"Chunk221: {chunk}")
                chunk_text = chunk["text"]
                # chunk_text = self._extract_chunk_text(chunk)
                logger.info(f"Chunk text222: {chunk_text}")
                # Analyze chunk
                themes = self.analyze_chunk_themes(chunk_text, str(i))
                quotes = self.analyze_chunk_quotes(chunk_text, str(i))
                insights = self.analyze_chunk_insights(chunk_text, str(i))
                
                chunk_results.append({
                    "chunk_id": str(i),
                    "themes": themes.get('themes', []),
                    "quotes": quotes.get('quotes', []),
                    "insights": insights.get('insights', [])
                })
            
            # Generate complete analysis
            return self.analyze_complete_transcript(study_id, chunk_results)
            
        except Exception as e:
            logger.error(f"Failed to get analysis for study {study_id}: {str(e)}")
            raise

    def _analyze_cross_themes(self, all_analyses: List[Dict]) -> Dict:
        """Find common themes across multiple studies"""
        logger.info("Analyzing cross-transcript themes")
        
        # Collect all themes from all studies
        all_themes = []
        for analysis in all_analyses:
            study_id = analysis.get('study_id', 'unknown')
            themes = analysis.get('consolidated_themes', [])
            
            for theme in themes:
                theme['source_study'] = study_id
                all_themes.append(theme)
        
        # Group similar themes across studies
        theme_clusters = self._cluster_similar_themes(all_themes)
        
        # Use OpenAI to analyze cross-study theme patterns
        cross_theme_prompt = """You are analyzing themes across multiple focus group studies.
        Identify common patterns, recurring themes, and variations across different groups.
        You must respond with valid JSON only, no additional text.
        
        Return this exact JSON structure:
        {
            "cross_themes": [
                {
                    "theme_name": "string",
                    "frequency_across_studies": "high/medium/low",
                    "consistency": "consistent/variable/divergent",
                    "study_variations": ["string"],
                    "meta_insight": "string"
                }
            ]
        }"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": cross_theme_prompt},
                    {"role": "user", "content": f"Analyze these cross-study themes:\n\n{json.dumps(theme_clusters[:20], indent=2)}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=2000
            )
            
            raw_content = response.choices[0].message.content
            cleaned_json = self._clean_json_response(raw_content)
            result = json.loads(cleaned_json)
            
            return result.get('cross_themes', [])
            
        except Exception as e:
            logger.error(f"Cross-theme analysis failed: {str(e)}")
            return []

    def _cluster_similar_themes(self, all_themes: List[Dict]) -> List[Dict]:
        """Group similar themes from different studies"""
        # Simple clustering by theme name similarity
        clusters = {}
        
        for theme in all_themes:
            theme_name = theme.get('theme_name', '').lower()
            
            # Find existing cluster or create new one
            cluster_key = None
            for existing_key in clusters.keys():
                if self._themes_are_similar(theme_name, existing_key):
                    cluster_key = existing_key
                    break
            
            if not cluster_key:
                cluster_key = theme_name
                clusters[cluster_key] = []
            
            clusters[cluster_key].append(theme)
        
        # Convert to list format
        clustered_themes = []
        for cluster_name, themes in clusters.items():
            clustered_themes.append({
                'cluster_name': cluster_name,
                'themes': themes,
                'frequency': len(themes),
                'studies_mentioned': list(set([t.get('source_study', '') for t in themes]))
            })
        
        return sorted(clustered_themes, key=lambda x: x['frequency'], reverse=True)

    def _analyze_demographic_patterns(self, all_analyses: List[Dict]) -> Dict:
        """Analyze demographic patterns across studies"""
        logger.info("Analyzing demographic patterns")
        
        # Extract demographic-related insights from all studies
        demographic_data = []
        for analysis in all_analyses:
            study_id = analysis.get('study_id', 'unknown')
            insights = analysis.get('actionable_insights', [])
            patterns = []
            
            # Look for demographic patterns in insights
            for insight in insights:
                if any(keyword in insight.get('insight_description', '').lower() 
                    for keyword in ['age', 'demographic', 'generation', 'segment', 'group']):
                    patterns.append({
                        'study_id': study_id,
                        'pattern': insight.get('insight_description', ''),
                        'type': insight.get('insight_type', 'unknown')
                    })
            
            demographic_data.extend(patterns)
        
        return {
            "demographic_patterns": demographic_data,
            "pattern_count": len(demographic_data),
            "studies_with_patterns": len(set([p['study_id'] for p in demographic_data]))
        }

    def _analyze_consensus_vs_divergence(self, all_analyses: List[Dict]) -> Dict:
        """Analyze where studies agree vs disagree"""
        logger.info("Analyzing consensus vs divergence")
        
        # Collect themes from all studies
        all_themes = {}
        for analysis in all_analyses:
            study_id = analysis.get('study_id', 'unknown')
            themes = analysis.get('consolidated_themes', [])
            
            for theme in themes:
                theme_name = theme.get('theme_name', '').lower()
                if theme_name not in all_themes:
                    all_themes[theme_name] = []
                
                all_themes[theme_name].append({
                    'study_id': study_id,
                    'frequency': theme.get('frequency', 0),
                    'description': theme.get('descriptions', [''])[0] if theme.get('descriptions') else ''
                })
        
        # Categorize themes
        consensus_themes = []  # Appear in multiple studies
        divergent_themes = []  # Appear in only one study
        
        for theme_name, occurrences in all_themes.items():
            if len(occurrences) > 1:
                consensus_themes.append({
                    'theme': theme_name,
                    'studies': [occ['study_id'] for occ in occurrences],
                    'consistency': 'high' if len(occurrences) == len(all_analyses) else 'medium'
                })
            else:
                divergent_themes.append({
                    'theme': theme_name,
                    'study': occurrences[0]['study_id'],
                    'uniqueness': 'study_specific'
                })
        
        return {
            "consensus_themes": consensus_themes,
            "divergent_themes": divergent_themes,
            "consensus_rate": len(consensus_themes) / len(all_themes) if all_themes else 0
        }

    def _analyze_trends_across_studies(self, all_analyses: List[Dict]) -> Dict:
        """Analyze trends and patterns across studies"""
        logger.info("Analyzing trends across studies")
        
        # Prepare trend data for OpenAI analysis
        trend_data = {
            "studies": [],
            "common_patterns": []
        }
        
        for analysis in all_analyses:
            study_summary = {
                "study_id": analysis.get('study_id', ''),
                "top_themes": [t.get('theme_name', '') for t in analysis.get('consolidated_themes', [])[:3]],
                "sentiment_indicators": [],
                "key_insights": [i.get('insight_title', '') for i in analysis.get('actionable_insights', [])[:2]]
            }
            trend_data["studies"].append(study_summary)
        
        # Use OpenAI to identify trends
        trend_prompt = """You are analyzing trends across multiple market research studies.
        Identify emerging patterns, recurring themes, and directional trends.
        You must respond with valid JSON only, no additional text.
        
        Return this exact JSON structure:
        {
            "trends": [
                {
                    "trend_name": "string",
                    "trend_direction": "increasing/decreasing/stable/emerging",
                    "evidence": ["string"],
                    "confidence": "high/medium/low",
                    "business_impact": "string"
                }
            ]
        }"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": trend_prompt},
                    {"role": "user", "content": f"Identify trends from this cross-study data:\n\n{json.dumps(trend_data, indent=2)}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=1500
            )
            
            raw_content = response.choices[0].message.content
            cleaned_json = self._clean_json_response(raw_content)
            result = json.loads(cleaned_json)
            
            return {
                "identified_trends": result.get('trends', []),
                "trend_analysis_method": "ai_powered",
                "studies_analyzed": len(all_analyses)
            }
            
        except Exception as e:
            logger.error(f"Trend analysis failed: {str(e)}")
            return {
                "identified_trends": [],
                "error": f"Trend analysis failed: {str(e)}",
                "studies_analyzed": len(all_analyses)
            }


    def _themes_are_similar(self, theme1: str, theme2: str) -> bool:
        """Simple similarity check for theme clustering"""
        # Basic keyword overlap check
        words1 = set(theme1.lower().split())
        words2 = set(theme2.lower().split())
        
        if not words1 or not words2:
            return False
        
        overlap = len(words1.intersection(words2))
        min_length = min(len(words1), len(words2))
        
        return overlap / min_length > 0.5  # 50% word overlap threshold

    def _generate_meta_insights(self, all_analyses: List[Dict]) -> List[Dict]:
        """Generate high-level insights that emerge from cross-study analysis"""
        logger.info("Generating meta-insights")
        
        # Prepare summary data for OpenAI
        meta_data = {
            "total_studies": len(all_analyses),
            "common_themes": [],
            "study_summaries": []
        }
        
        for analysis in all_analyses:
            study_summary = {
                "study_id": analysis.get('study_id', ''),
                "top_themes": [t.get('theme_name', '') for t in analysis.get('consolidated_themes', [])[:3]],
                "key_insights": [i.get('insight_title', '') for i in analysis.get('actionable_insights', [])[:2]]
            }
            meta_data["study_summaries"].append(study_summary)
        
        meta_prompt = """You are a senior research director analyzing multiple focus group studies.
        Generate strategic meta-insights that only become apparent when analyzing multiple studies together.
        Focus on overarching patterns, market implications, and strategic recommendations.
        You must respond with valid JSON only, no additional text.
        
        Return this exact JSON structure:
        {
            "meta_insights": [
                {
                    "insight_title": "string",
                    "insight_description": "string",
                    "evidence_across_studies": ["string"],
                    "strategic_importance": "high/medium/low",
                    "market_implications": "string",
                    "recommended_strategy": "string"
                }
            ]
        }"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": meta_prompt},
                    {"role": "user", "content": f"Generate meta-insights from this cross-study data:\n\n{json.dumps(meta_data, indent=2)}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=2000
            )
            
            raw_content = response.choices[0].message.content
            cleaned_json = self._clean_json_response(raw_content)
            result = json.loads(cleaned_json)
            
            return result.get('meta_insights', [])
            
        except Exception as e:
            logger.error(f"Meta-insights generation failed: {str(e)}")
            return []

    def _clean_json_response(self, raw_content: str) -> str:
        """Clean and prepare JSON response for parsing"""
        try:
            logger.debug(f"Cleaning JSON response, length: {len(raw_content)}")
            
            if not raw_content:
                raise ValueError("Empty response content")
            
            # Remove any markdown code blocks
            content = raw_content.strip()
            if content.startswith('```json'):
                content = content[7:]
            elif content.startswith('```'):
                content = content[3:]
            
            if content.endswith('```'):
                content = content[:-3]
            
            content = content.strip()
            
            # Fix common JSON issues
            import re
            content = re.sub(r',\s*}', '}', content)  # Remove trailing commas
            content = re.sub(r',\s*]', ']', content)  # Remove trailing commas in arrays
            
            # Additional JSON cleaning
            content = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', content)  # Remove control characters
            content = re.sub(r'\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', content)  # Fix invalid escapes
            
            # Ensure the content starts and ends with proper JSON delimiters
            content = content.strip()
            if not (content.startswith('{') or content.startswith('[')):
                # Try to find JSON object/array in the content
                json_match = re.search(r'[\{\[].*[\}\]]', content, re.DOTALL)
                if json_match:
                    content = json_match.group(0)
                else:
                    raise ValueError("No valid JSON structure found")
            
            logger.debug(f"Cleaned JSON content: {content[:100]}...")
            return content
            
        except Exception as e:
            logger.error(f"Error cleaning JSON: {str(e)}")
            raise
    
    def _create_fallback_response(self, chunk_id: str, analysis_type: str, error_msg: str) -> Dict:
        """Create fallback response when JSON parsing fails"""
        fallback_structures = {
            "themes": {
                "chunk_id": chunk_id,
                "analysis_type": "themes",
                "themes": [{
                    "theme_name": "Analysis Error",
                    "description": f"Failed to parse response: {error_msg}",
                    "key_points": ["Manual review required"],
                    "related_quotes": []
                }],
                "error": True
            },
            "quotes": {
                "chunk_id": chunk_id,
                "analysis_type": "quotes", 
                "quotes": [],
                "error": True
            },
            "insights": {
                "chunk_id": chunk_id,
                "analysis_type": "insights",
                "insights": [],
                "error": True
            },
            "patterns": {
                "chunk_id": chunk_id,
                "analysis_type": "patterns",
                "patterns": [],
                "error": True
            }
        }
        
        return fallback_structures.get(analysis_type, {"error": True, "chunk_id": chunk_id})

    # step 9
    def format_results_for_dashboard(self, analysis_result: Dict, analysis_type: str) -> Dict:
        """Format analysis results for frontend dashboard consumption"""
        try:
            logger.info(f"Formatting {analysis_type} results for dashboard")
            
            if analysis_type == "single_transcript":
                return self._format_single_transcript_dashboard(analysis_result)
            elif analysis_type == "cross_transcript":
                return self._format_cross_transcript_dashboard(analysis_result)
            else:
                return self._format_generic_dashboard(analysis_result)
                
        except Exception as e:
            logger.error(f"Dashboard formatting failed: {str(e)}")
            return {"error": f"Formatting failed: {str(e)}"}

    def _format_single_transcript_dashboard(self, result: Dict) -> Dict:
        """Format single transcript results for dashboard"""
        logger.info("Formatting single transcript for dashboard")
        
        complete_analysis = result.get('complete_analysis', {})
        chunk_results = result.get('chunk_results', [])
        
        return {
            "study_overview": {
                "study_id": result.get('study_id', ''),
                "total_chunks": len(chunk_results),
                "analysis_date": result.get('timestamp', ''),
                "status": result.get('status', 'completed')
            },
            "summary_cards": self._create_summary_cards(complete_analysis),
            "theme_visualization": self._prepare_theme_charts(complete_analysis),
            "quote_highlights": self._select_key_quotes(complete_analysis),
            "insight_cards": self._format_insight_cards(complete_analysis),
            "export_ready_data": self._prepare_export_data(result),
            "chart_data": self._prepare_chart_data(complete_analysis)
        }

    def _create_summary_cards(self, analysis: Dict) -> List[Dict]:
        """Create summary cards for dashboard overview"""
        logger.info("Creating summary cards")
        
        executive_summary = analysis.get('executive_summary', {})
        consolidated_themes = analysis.get('consolidated_themes', [])
        actionable_insights = analysis.get('actionable_insights', [])
        
        cards = [
            {
                "title": "Key Findings",
                "value": len(executive_summary.get('key_findings', [])),
                "description": "Primary insights discovered",
                "icon": "findings",
                "color": "blue"
            },
            {
                "title": "Themes Identified",
                "value": len(consolidated_themes),
                "description": "Major themes across transcript",
                "icon": "themes",
                "color": "green"
            },
            {
                "title": "Actionable Insights",
                "value": len(actionable_insights),
                "description": "Business recommendations",
                "icon": "insights",
                "color": "purple"
            },
            {
                "title": "Participant Sentiment",
                "value": executive_summary.get('participant_sentiment', 'Mixed').title(),
                "description": "Overall sentiment analysis",
                "icon": "sentiment",
                "color": self._get_sentiment_color(executive_summary.get('participant_sentiment', 'mixed'))
            }
        ]
        
        return cards

    def _prepare_theme_charts(self, analysis: Dict) -> Dict:
        """Prepare theme data for charts and visualizations"""
        logger.info("Preparing theme visualization data")
        
        consolidated_themes = analysis.get('consolidated_themes', [])
        
        # Theme frequency chart data
        theme_frequency = {
            "labels": [theme.get('theme_name', 'Unknown')[:30] for theme in consolidated_themes[:8]],
            "data": [theme.get('frequency', 0) for theme in consolidated_themes[:8]],
            "backgroundColor": [
                "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
                "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"
            ]
        }
        
        # Theme sentiment distribution
        sentiment_data = {"positive": 0, "negative": 0, "neutral": 0}
        for theme in consolidated_themes:
            descriptions = theme.get('descriptions', [])
            # Simple sentiment analysis based on keywords
            sentiment = self._analyze_theme_sentiment(descriptions)
            sentiment_data[sentiment] += 1
        
        return {
            "theme_frequency": {
                "type": "doughnut",
                "data": theme_frequency,
                "title": "Theme Distribution"
            },
            "sentiment_distribution": {
                "type": "bar",
                "data": {
                    "labels": ["Positive", "Negative", "Neutral"],
                    "datasets": [{
                        "label": "Theme Sentiment",
                        "data": [sentiment_data["positive"], sentiment_data["negative"], sentiment_data["neutral"]],
                        "backgroundColor": ["#4CAF50", "#F44336", "#9E9E9E"]
                    }]
                },
                "title": "Sentiment Analysis"
            }
        }

    def _select_key_quotes(self, analysis: Dict) -> List[Dict]:
        """Select and format key quotes for dashboard display"""
        logger.info("Selecting key quotes")
        
        organized_quotes = analysis.get('organized_quotes', {})
        key_quotes = []
        
        # Get top quotes from each theme
        for theme_name, theme_data in list(organized_quotes.items())[:5]:
            quotes = theme_data.get('related_quotes', [])[:2]  # Top 2 quotes per theme
            
            for quote in quotes:
                key_quotes.append({
                    "text": quote.get('quote_text', ''),
                    "speaker": quote.get('speaker', 'Participant'),
                    "theme": theme_name,
                    "context": quote.get('context', ''),
                    "sentiment": quote.get('sentiment', 'neutral'),
                    "relevance_score": quote.get('theme_relevance', 'medium')
                })
        
        # Sort by relevance and return top 10
        return sorted(key_quotes, key=lambda x: self._quote_relevance_score(x), reverse=True)[:10]

    def _format_insight_cards(self, analysis: Dict) -> List[Dict]:
        """Format actionable insights as cards"""
        logger.info("Formatting insight cards")
        
        insights = analysis.get('actionable_insights', [])
        
        formatted_insights = []
        for insight in insights[:6]:  # Top 6 insights
            formatted_insights.append({
                "title": insight.get('insight_title', 'Insight'),
                "description": insight.get('insight_description', ''),
                "impact": insight.get('business_impact', 'medium'),
                "timeline": insight.get('timeline', 'short-term'),
                "actions": insight.get('recommended_actions', []),
                "metrics": insight.get('success_metrics', []),
                "priority": self._calculate_insight_priority(insight)
            })
        
        return sorted(formatted_insights, key=lambda x: x['priority'], reverse=True)

    def _prepare_export_data(self, result: Dict) -> Dict:
        """Prepare data for PDF/Excel export"""
        logger.info("Preparing export data")
        
        return {
            "executive_summary": result.get('complete_analysis', {}).get('executive_summary', {}),
            "detailed_themes": result.get('complete_analysis', {}).get('consolidated_themes', []),
            "all_quotes": result.get('complete_analysis', {}).get('organized_quotes', {}),
            "recommendations": result.get('complete_analysis', {}).get('actionable_insights', []),
            "metadata": {
                "export_timestamp": datetime.utcnow().isoformat(),
                "study_id": result.get('study_id', ''),
                "total_chunks": len(result.get('chunk_results', []))
            }
        }

    def _format_cross_transcript_dashboard(self, result: Dict) -> Dict:
        """Format cross-transcript results for dashboard"""
        logger.info("Formatting cross-transcript for dashboard")
        
        cross_analysis = result.get('cross_analysis', {})
        
        return {
            "study_comparison": {
                "studies_analyzed": cross_analysis.get('studies_analyzed', []),
                "total_studies": cross_analysis.get('metadata', {}).get('total_studies', 0),
                "analysis_date": result.get('timestamp', '')
            },
            "cross_theme_analysis": self._format_cross_themes(cross_analysis.get('cross_themes', [])),
            "consensus_divergence": self._format_consensus_data(cross_analysis.get('consensus_analysis', {})),
            "trend_visualization": self._format_trend_data(cross_analysis.get('trend_analysis', {})),
            "meta_insights": cross_analysis.get('meta_insights', []),
            "comparison_charts": self._prepare_comparison_charts(cross_analysis)
        }

    # Helper methods
    def _get_sentiment_color(self, sentiment: str) -> str:
        """Get color based on sentiment"""
        colors = {"positive": "green", "negative": "red", "neutral": "gray", "mixed": "orange"}
        return colors.get(sentiment.lower(), "gray")

    def _analyze_theme_sentiment(self, descriptions: List[str]) -> str:
        """Simple sentiment analysis for themes"""
        positive_words = ["good", "great", "love", "prefer", "convenient", "easy", "fast"]
        negative_words = ["bad", "hate", "difficult", "slow", "problem", "issue", "concern"]
        
        text = " ".join(descriptions).lower()
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"

    def _quote_relevance_score(self, quote: Dict) -> int:
        """Calculate quote relevance score for sorting"""
        score = 0
        if quote.get('relevance_score') == 'high':
            score += 3
        elif quote.get('relevance_score') == 'medium':
            score += 2
        else:
            score += 1
        
        if len(quote.get('text', '')) > 50:  # Prefer longer quotes
            score += 1
        
        return score

    def _calculate_insight_priority(self, insight: Dict) -> int:
        """Calculate insight priority for sorting"""
        priority = 0
        
        if insight.get('business_impact') == 'high':
            priority += 3
        elif insight.get('business_impact') == 'medium':
            priority += 2
        else:
            priority += 1
        
        if insight.get('timeline') == 'immediate':
            priority += 2
        elif insight.get('timeline') == 'short-term':
            priority += 1
        
        return priority

    def _format_generic_dashboard(self, result: Dict) -> Dict:
        """Generic formatting fallback for dashboard"""
        return {
            "raw_result": result,
            "formatted": False,
            "message": "Generic formatting applied"
        }

    def _prepare_chart_data(self, analysis: Dict) -> Dict:
        """Prepare generic chart data from analysis"""
        consolidated_themes = analysis.get('consolidated_themes', [])
        if not consolidated_themes:
            return {}

        labels = [theme.get('theme_name', 'Unknown')[:30] for theme in consolidated_themes[:10]]
        data = [theme.get('frequency', 0) for theme in consolidated_themes[:10]]

        return {
            "theme_frequency_chart": {
                "type": "bar",
                "data": {
                    "labels": labels,
                    "datasets": [{
                        "label": "Theme Frequency",
                        "data": data,
                        "backgroundColor": "#36A2EB"
                    }]
                },
                "options": {
                    "responsive": True,
                    "plugins": {
                        "legend": {"position": "top"},
                        "title": {"display": True, "text": "Top Themes Frequency"}
                    }
                }
            }
        }

    def _format_cross_themes(self, cross_themes: List[Dict]) -> List[Dict]:
        """Format cross-study theme analysis for dashboard"""
        formatted = []
        for theme in cross_themes:
            formatted.append({
                "theme_name": theme.get('theme_name', 'Unknown'),
                "frequency_across_studies": theme.get('frequency_across_studies', 'unknown'),
                "consistency": theme.get('consistency', 'unknown'),
                "study_variations": theme.get('study_variations', []),
                "meta_insight": theme.get('meta_insight', '')
            })
        return formatted

    def _format_consensus_data(self, consensus_data: Dict) -> Dict:
        """Format consensus and divergence data for dashboard"""
        return {
            "consensus_themes": consensus_data.get('consensus_themes', []),
            "divergent_themes": consensus_data.get('divergent_themes', []),
            "consensus_rate": consensus_data.get('consensus_rate', 0),
            "total_themes_analyzed": len(consensus_data.get('consensus_themes', [])) + len(consensus_data.get('divergent_themes', []))
        }

    def _format_trend_data(self, trend_data: Dict) -> Dict:
        """Format trend analysis data for dashboard"""
        return {
            "identified_trends": trend_data.get('identified_trends', []),
            "trend_analysis_method": trend_data.get('trend_analysis_method', 'unknown'),
            "studies_analyzed": trend_data.get('studies_analyzed', 0),
            "trend_count": len(trend_data.get('identified_trends', []))
        }

    def _prepare_comparison_charts(self, cross_analysis: Dict) -> Dict:
        """Prepare comparison charts for cross-transcript dashboard"""
        consensus = cross_analysis.get('consensus_analysis', {})
        trends = cross_analysis.get('trend_analysis', {})

        # Consensus vs Divergence pie chart
        consensus_count = len(consensus.get('consensus_themes', []))
        divergent_count = len(consensus.get('divergent_themes', []))

        pie_chart = {
            "type": "pie",
            "data": {
                "labels": ["Consensus Themes", "Divergent Themes"],
                "datasets": [{
                    "data": [consensus_count, divergent_count],
                    "backgroundColor": ["#4CAF50", "#F44336"]
                }]
            },
            "options": {
                "responsive": True,
                "plugins": {
                    "legend": {"position": "bottom"},
                    "title": {"display": True, "text": "Consensus vs Divergence"}
                }
            }
        }

        # Trend confidence bar chart
        trends_list = trends.get('identified_trends', [])
        trend_names = [t.get('trend_name', 'Unknown')[:20] for t in trends_list[:8]]
        trend_confidences = [
            1 if t.get('confidence', 'low') == 'high' else 
            0.7 if t.get('confidence', 'low') == 'medium' else 0.3 
            for t in trends_list[:8]
        ]

        bar_chart = {
            "type": "bar",
            "data": {
                "labels": trend_names,
                "datasets": [{
                    "label": "Confidence Level",
                    "data": trend_confidences,
                    "backgroundColor": "#2196F3"
                }]
            },
            "options": {
                "responsive": True,
                "plugins": {
                    "legend": {"display": False},
                    "title": {"display": True, "text": "Trend Confidence Levels"}
                },
                "scales": {
                    "y": {"beginAtZero": True, "max": 1}
                }
            }
        }

        return {
            "consensus_pie_chart": pie_chart,
            "trend_bar_chart": bar_chart
        }

# Create global instance
llm_analyzer = LLMAnalyzer()
