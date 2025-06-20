# Database Schema

## Setup Instructions
1. Run migrations in order: `001_setup_pgvector.sql`
2. Run functions: `vector_search_functions.sql`

## Tables Created
- `transcript_embeddings`: Stores chunk embeddings
- `theme_embeddings`: Stores theme embeddings  
- `insight_embeddings`: Stores insight embeddings

## Functions Created
- `match_themes()`: Find similar themes
- `match_insights()`: Find similar insights
