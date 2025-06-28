# InsightSim Database Schema

## Setup Instructions
Run migrations in order:
1. `001_setup_pgvector.sql` - Sets up vector embeddings tables and indexes
2. `002_add_analysis_results.sql` - Adds analysis results storage table

Run functions:
1. `vector_search_functions.sql` - Vector similarity search functions
2. `analysis_functions.sql` - Analysis results CRUD functions

## Database Structure

### Vector Embedding Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `transcript_embeddings` | Stores chunk-level embeddings | study_id (UUID), chunk_id, embedding (1536) |
| `theme_embeddings` | Stores theme embeddings | study_id (UUID), theme_name, embedding (1536) |
| `insight_embeddings` | Stores insight embeddings | study_id (UUID), insight_title, embedding (1536) |

### Analysis Storage Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `analysis_results` | Complete analysis results storage | study_id (VARCHAR), analysis_data (JSONB), status |

### Key Indexes
- **Vector indexes**: IVFFlat cosine similarity on all embedding columns
- **Study filters**: B-tree indexes on study_id for all tables
- **Analysis queries**: Indexes on status, created_at for analysis_results

## Database Functions

### Vector Search Functions
- `match_themes(query_embedding, threshold, count, study_filter)` - Find similar themes
- `match_insights(query_embedding, threshold, count, study_filter)` - Find similar insights

### Analysis Result Functions
- `get_analysis_results(study_id)` - Retrieve complete analysis for a study
- `get_analysis_summaries(study_ids[], limit)` - Get analysis summaries with key metrics
- `analysis_exists(study_id)` - Check if completed analysis exists
- `get_analysis_metadata(study_id)` - Get analysis metadata without full results

## Data Flow

```
Upload → Text Extraction → Chunking → LLM Analysis → Complete Analysis
   ↓                                                         ↓
File Storage                                           analysis_results
   ↓                                                         ↓
Vector Processing → Embeddings → Vector Tables        Dashboard Data
```

## Analysis Data Structure

The `analysis_results.analysis_data` JSONB field contains:

```json
{
  "study_id": "string",
  "analysis_results": {
    "filename.txt": {
      "study_id": "string",
      "total_chunks_analyzed": 1,
      "chunk_analyses": [...],
      "aggregated_results": {...}
    }
  },
  "study_insights": {
    "executive_summary": {...},
    "consolidated_themes": [...],
    "organized_quotes": {...},
    "actionable_insights": [...]
  },
  "dashboard_data": {
    "study_overview": {...},
    "summary_cards": [...],
    "theme_visualization": {...},
    "quote_highlights": [...],
    "insight_cards": [...],
    "export_ready_data": {...}
  },
  "metadata": {
    "total_chunks": 1,
    "files_processed": ["filename.txt"],
    "analysis_timestamp": "2025-06-25T18:57:47.831999",
    "embeddings_stored": true
  }
}
```

## Performance Considerations

- **Vector searches**: Use appropriate similarity thresholds (0.7-0.8)
- **Large result sets**: Use pagination for analysis summaries
- **JSONB queries**: Index frequently accessed JSON paths if needed
- **Study filtering**: Always include study_id filters for better performance

## Backup & Maintenance

- **Vector tables**: Large due to embedding data (~6KB per embedding)
- **Analysis results**: Can be large JSONB documents (~100KB-1MB per study)
- **Retention**: Consider archiving old analysis versions
- **Monitoring**: Track table sizes and query performance
