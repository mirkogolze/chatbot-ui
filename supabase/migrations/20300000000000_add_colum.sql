ALTER TABLE files
ADD embeddings_provider TEXT;
ALTER TABLE files
ADD summerize BOOLEAN DEFAULT FALSE;