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

# Create global instance
llm_analyzer = LLMAnalyzer()
