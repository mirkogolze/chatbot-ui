--------------- COLLECTIONS ---------------

-- TABLE --

CREATE TABLE IF NOT EXISTS vectors (
    -- ID
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- REQUIRED RELATIONSHIPS
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- OPTIONAL RELATIONSHIPS
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,

    -- METADATA
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,


    name TEXT NOT NULL
);

-- INDEXES --

CREATE INDEX vectors_user_id_idx ON vectors(user_id);

-- RLS --

ALTER TABLE vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own vectors"
    ON vectors
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());



-- TRIGGERS --

CREATE TRIGGER update_vectors_updated_at
BEFORE UPDATE ON vectors
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

--------------- COLLECTION WORKSPACES ---------------

-- TABLE --

CREATE TABLE IF NOT EXISTS vector_workspaces (
    -- REQUIRED RELATIONSHIPS
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    qdrant_id UUID NOT NULL REFERENCES vectors(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    PRIMARY KEY(qdrant_id, workspace_id),

    -- METADATA
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

-- INDEXES --

CREATE INDEX vector_workspaces_user_id_idx ON vector_workspaces(user_id);
CREATE INDEX vector_workspaces_vector_id_idx ON vector_workspaces(qdrant_id);
CREATE INDEX vector_workspaces_workspace_id_idx ON vector_workspaces(workspace_id);

-- RLS --

ALTER TABLE vector_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own vector_workspaces"
    ON vector_workspaces
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- TRIGGERS --

CREATE TRIGGER update_vector_workspaces_updated_at
BEFORE UPDATE ON vector_workspaces 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

