-- Write dummy to openai_api_key in profiles
CREATE OR REPLACE FUNCTION insert_profile_trigger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET openai_api_key = 'dummy'
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER insert_profile
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE PROCEDURE insert_profile_trigger();

-- Create custom model for workspace.
CREATE OR REPLACE FUNCTION insert_custom_models()
RETURNS TRIGGER AS $$
BEGIN

    UPDATE workspaces SET embeddings_provider = 'multilingual-e5-large', default_model = 'mixtral-8x7B'
    WHERE id = NEW.id;

    INSERT INTO models(user_id, api_key, base_url, model_id, name, description, context_length)
    VALUES (NEW.user_id, 'dummy', 'https://openai-api.mms-at-work.de/v1', 'codellama-34b', 'Codellama-34b', 'EMTPY', 8192);
    INSERT INTO model_workspaces(model_id, workspace_id, user_id)
    VALUES ((SELECT ID from models where user_id = NEW.user_id and model_id = 'codellama-34b'), NEW.id, NEW.user_id);

    INSERT INTO models(user_id, api_key, base_url, model_id, name, description, context_length)
    VALUES (NEW.user_id, 'dummy', 'https://openai-api.mms-at-work.de/v1', 'mixtral-8x7B', 'Mixtral-8x7B', 'EMTPY', 16384);
    INSERT INTO model_workspaces(model_id, workspace_id, user_id)
    VALUES ((SELECT ID from models where user_id = NEW.user_id and model_id = 'mixtral-8x7B'), NEW.id, NEW.user_id);

    INSERT INTO models(user_id, api_key, base_url, model_id, name, description, context_length)
    VALUES (NEW.user_id, 'dummy', 'https://openai-api.mms-at-work.de/v1', 'llama3-70b', 'Llama3-70b', 'EMTPY', 8192);
    INSERT INTO model_workspaces(model_id, workspace_id, user_id)
    VALUES ((SELECT ID from models where user_id = NEW.user_id and model_id = 'llama3-70b'), NEW.id, NEW.user_id);

    RETURN NEW;    
END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER custom_models
AFTER INSERT ON workspaces
FOR EACH ROW
EXECUTE PROCEDURE insert_custom_models();

