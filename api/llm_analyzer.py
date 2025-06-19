import os
from dotenv import load_dotenv
from typing import List, Dict, Optional, Union
from dataclasses import dataclass
import json
from fastapi import HTTPException

# OpenAI integration through LlamaIndex
from llama_index.llms.openai import OpenAI
from llama_index.core.llms import ChatMessage, MessageRole

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
        # Initialize OpenAI LLM through LlamaIndex
        self.llm = OpenAI(
            model="gpt-3.5-turbo",
            temperature=0.3,  # Lower temperature for more consistent analysis
            max_tokens=1500,
            api_key=api_key
        )
        
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
        """Extract themes from a single chunk"""
        try:
            # Create chat message for theme extraction
            messages = [
                ChatMessage(
                    role=MessageRole.USER,
                    content=self.theme_extraction_prompt.format(chunk_text=chunk_text)
                )
            ]
            
            # Get response from LLM
            response = self.llm.chat(messages)
            
            # Parse JSON response
            try:
                result = json.loads(response.message.content)
                result["chunk_id"] = chunk_id
                result["analysis_type"] = "themes"
                return result
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "chunk_id": chunk_id,
                    "analysis_type": "themes",
                    "themes": [],
                    "error": "Failed to parse LLM response as JSON"
                }
                
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Theme analysis failed for chunk {chunk_id}: {str(e)}"
            )
    
    def analyze_chunk_patterns(self, chunk_text: str, chunk_id: str) -> Dict:
        """Extract behavioral and demographic patterns from a single chunk"""
        try:
            messages = [
                ChatMessage(
                    role=MessageRole.USER,
                    content=self.pattern_analysis_prompt.format(chunk_text=chunk_text)
                )
            ]
            
            response = self.llm.chat(messages)
            
            try:
                result = json.loads(response.message.content)
                result["chunk_id"] = chunk_id
                result["analysis_type"] = "patterns"
                return result
            except json.JSONDecodeError:
                return {
                    "chunk_id": chunk_id,
                    "analysis_type": "patterns",
                    "patterns": [],
                    "error": "Failed to parse LLM response as JSON"
                }
                
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Pattern analysis failed for chunk {chunk_id}: {str(e)}"
            )

# Update your analyze_single_chunk method to include patterns (around line 210)
    def analyze_single_chunk(self, chunk_data: Dict, analysis_types: List[str] = None) -> Dict:
        """Perform comprehensive analysis on a single chunk"""
        if analysis_types is None:
            analysis_types = ["themes", "quotes", "insights", "patterns"]  # Add patterns here
        
        chunk_text = chunk_data["text"]
        chunk_id = chunk_data["chunk_id"]
        
        results = {
            "chunk_id": chunk_id,
            "chunk_index": chunk_data["chunk_index"],
            "analysis_results": {}
        }
        
        # Perform requested analyses
        if "themes" in analysis_types:
            results["analysis_results"]["themes"] = self.analyze_chunk_themes(chunk_text, chunk_id)
        
        if "quotes" in analysis_types:
            results["analysis_results"]["quotes"] = self.analyze_chunk_quotes(chunk_text, chunk_id)
        
        if "insights" in analysis_types:
            results["analysis_results"]["insights"] = self.analyze_chunk_insights(chunk_text, chunk_id)
        
        if "patterns" in analysis_types:  # Add this new condition
            results["analysis_results"]["patterns"] = self.analyze_chunk_patterns(chunk_text, chunk_id)
        
        return results
    
    def analyze_chunk_quotes(self, chunk_text: str, chunk_id: str) -> Dict:
        """Extract significant quotes from a single chunk"""
        try:
            messages = [
                ChatMessage(
                    role=MessageRole.USER,
                    content=self.quote_extraction_prompt.format(chunk_text=chunk_text)
                )
            ]
            
            response = self.llm.chat(messages)
            
            try:
                result = json.loads(response.message.content)
                result["chunk_id"] = chunk_id
                result["analysis_type"] = "quotes"
                return result
            except json.JSONDecodeError:
                return {
                    "chunk_id": chunk_id,
                    "analysis_type": "quotes",
                    "quotes": [],
                    "error": "Failed to parse LLM response as JSON"
                }
                
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Quote analysis failed for chunk {chunk_id}: {str(e)}"
            )
    
    def analyze_chunk_insights(self, chunk_text: str, chunk_id: str) -> Dict:
        """Generate insights from a single chunk"""
        try:
            messages = [
                ChatMessage(
                    role=MessageRole.USER,
                    content=self.insight_generation_prompt.format(chunk_text=chunk_text)
                )
            ]
            
            response = self.llm.chat(messages)
            
            try:
                result = json.loads(response.message.content)
                result["chunk_id"] = chunk_id
                result["analysis_type"] = "insights"
                return result
            except json.JSONDecodeError:
                return {
                    "chunk_id": chunk_id,
                    "analysis_type": "insights",
                    "insights": [],
                    "error": "Failed to parse LLM response as JSON"
                }
                
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Insight analysis failed for chunk {chunk_id}: {str(e)}"
            )
    
    def analyze_single_chunk(self, chunk_data: Dict, analysis_types: List[str] = None) -> Dict:
        """Perform comprehensive analysis on a single chunk"""
        if analysis_types is None:
            analysis_types = ["themes", "quotes", "insights"]
        
        chunk_text = chunk_data["text"]
        chunk_id = chunk_data["chunk_id"]
        
        results = {
            "chunk_id": chunk_id,
            "chunk_index": chunk_data["chunk_index"],
            "analysis_results": {}
        }
        
        # Perform requested analyses
        if "themes" in analysis_types:
            results["analysis_results"]["themes"] = self.analyze_chunk_themes(chunk_text, chunk_id)
        
        if "quotes" in analysis_types:
            results["analysis_results"]["quotes"] = self.analyze_chunk_quotes(chunk_text, chunk_id)
        
        if "insights" in analysis_types:
            results["analysis_results"]["insights"] = self.analyze_chunk_insights(chunk_text, chunk_id)
        
        return results
    
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

# Create global instance
llm_analyzer = LLMAnalyzer()
