-- Enable Row Level Security on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Policy for users to only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy for ads
CREATE POLICY "Users can view own ads" ON ads
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own ads" ON ads
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own ads" ON ads
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own ads" ON ads
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create function to automatically clean old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete completed ads older than 30 days
    DELETE FROM ads 
    WHERE status = 'completed' 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Delete users with no ads older than 90 days
    DELETE FROM users 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND NOT EXISTS (SELECT 1 FROM ads WHERE user_id = users.id);
    
    -- Update ads with zero budget to completed
    UPDATE ads 
    SET status = 'completed' 
    WHERE budget = 0 AND status != 'completed';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();'); 