-- Add foreign key constraints to existing tables

-- Add foreign key from keywords.category to categories.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_keywords_category'
    ) THEN
        ALTER TABLE keywords
        ADD CONSTRAINT fk_keywords_category 
        FOREIGN KEY (category) 
        REFERENCES categories(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;

-- Add foreign key from keyword_suggestions.category_id to categories.id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_keyword_suggestions_category'
    ) THEN
        ALTER TABLE keyword_suggestions
        ADD CONSTRAINT fk_keyword_suggestions_category 
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;
