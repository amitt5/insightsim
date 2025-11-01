# Project Analysis Database Schema

## Table: `project_analysis`

Stores LLM-generated analysis results for projects, supporting synthetic, human, and combined analysis types.

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for each analysis record |
| `project_id` | UUID | NOT NULL, FOREIGN KEY references projects(id) | The project this analysis belongs to |
| `source` | TEXT | NOT NULL, CHECK IN ('synthetic', 'human', 'combined') | Type of analysis: synthetic (simulations), human (interviews), or combined |
| `analysis_json` | JSONB | NOT NULL | The complete analysis object from LLM, stored as JSON |
| `model` | TEXT | NOT NULL | The LLM model used (e.g., 'gpt-4o-mini') |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When the analysis was first created |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When the analysis was last updated |

### Unique Constraint

- `(project_id, source)` - Ensures one analysis record per project per source type (overwrites on regenerate)

### Indexes

- Primary key on `id`
- Unique index on `(project_id, source)` for fast lookups
- Index on `project_id` for project queries
- Index on `source` if needed for filtering by type

### JSON Structure

The `analysis_json` column stores the validated analysis structure:

```json
{
  "analysis": [
    {
      "question": "Question text",
      "summary": "AI-generated summary",
      "categories": [
        {"name": "Category Name", "percentage": 75}
      ],
      "verbatims": [
        {
          "quote": "Exact quote from transcript",
          "tags": ["Category Name 1", "Category Name 2"]
        }
      ]
    }
  ]
}
```

### Usage

- **Synthetic**: Analysis generated from simulation transcripts
- **Human**: Analysis generated from human interview transcripts (future)
- **Combined**: Merged analysis from both synthetic and human sources (future)

### Notes

- Each project can have up to 3 analysis records (one per source type)
- Regenerating analysis updates the existing record (overwrites)
- JSONB allows efficient querying and indexing of nested JSON data

