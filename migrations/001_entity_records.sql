CREATE TABLE IF NOT EXISTS entity_records (
  entity TEXT NOT NULL,
  id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity, id)
);

CREATE INDEX IF NOT EXISTS entity_records_entity_idx ON entity_records(entity);
CREATE INDEX IF NOT EXISTS entity_records_data_gin_idx ON entity_records USING GIN(data);
