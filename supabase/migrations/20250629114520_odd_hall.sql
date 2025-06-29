/*
  # English Learning Platform Database Schema

  1. New Tables
    - `profiles` - User profile information with role-based access
    - `courses` - Course catalog with multilingual support
    - `user_courses` - User enrollment and progress tracking
    - `testimonials` - Student testimonials and reviews
    - `promotional_content` - Marketing content management
    - `orders` - Payment and order tracking
    - `feedback` - Course feedback system
    - `user_inquiries` - Contact form submissions
    - `page_analytics` - Website analytics tracking
    - `privacy_consents` - GDPR compliance tracking
    - `translations` - Multilingual content management

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Create user registration trigger

  3. Functions
    - User registration handler
*/

-- Create profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text,
      age integer,
      occupation text,
      language_preference text DEFAULT 'student',
      phone text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Users can view and edit own profile" ON profiles;
CREATE POLICY "Users can view and edit own profile"
  ON profiles
  FOR ALL
  TO public
  USING (auth.uid() = id);

-- Create courses table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
    CREATE TABLE courses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title_th text NOT NULL,
      title_en text NOT NULL,
      description_th text,
      description_en text,
      level text DEFAULT 'Beginner',
      image_url text,
      price numeric(10,2) DEFAULT 0,
      duration_weeks integer DEFAULT 4,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL,
      price_thb numeric(10,2) DEFAULT 0,
      duration_hours integer DEFAULT 20,
      lessons_count integer DEFAULT 10,
      difficulty_level text DEFAULT 'Beginner',
      is_premium boolean DEFAULT false,
      preview_video_url text,
      instructor_name text,
      CONSTRAINT courses_level_check CHECK (level = ANY (ARRAY['Beginner'::text, 'Intermediate'::text, 'Advanced'::text]))
    );
  END IF;
END $$;

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
CREATE POLICY "Anyone can view courses"
  ON courses
  FOR SELECT
  TO public
  USING (true);

-- Create user_courses table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_courses') THEN
    CREATE TABLE user_courses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      course_id uuid,
      enrolled_at timestamptz DEFAULT now(),
      completed_at timestamptz,
      progress_percentage integer DEFAULT 0,
      payment_status text DEFAULT 'free'
    );
    
    -- Add foreign key constraints
    ALTER TABLE user_courses ADD CONSTRAINT user_courses_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    ALTER TABLE user_courses ADD CONSTRAINT user_courses_course_id_fkey 
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
    
    -- Add unique constraint
    ALTER TABLE user_courses ADD CONSTRAINT user_courses_user_id_course_id_key 
      UNIQUE(user_id, course_id);
  END IF;
END $$;

-- Enable RLS on user_courses
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Users can view own enrollments" ON user_courses;
CREATE POLICY "Users can view own enrollments"
  ON user_courses
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Create testimonials table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'testimonials') THEN
    CREATE TABLE testimonials (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name_th text NOT NULL,
      name_en text,
      quote_th text NOT NULL,
      quote_en text,
      image_url text,
      rating integer DEFAULT 5,
      course_completed text,
      created_at timestamptz DEFAULT now() NOT NULL,
      age integer,
      occupation text,
      course_taken text,
      is_featured boolean DEFAULT false,
      video_url text,
      CONSTRAINT testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
    );
  END IF;
END $$;

-- Enable RLS on testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Anyone can view testimonials" ON testimonials;
CREATE POLICY "Anyone can view testimonials"
  ON testimonials
  FOR SELECT
  TO public
  USING (true);

-- Create promotional_content table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'promotional_content') THEN
    CREATE TABLE promotional_content (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      content_type text NOT NULL,
      variant_name text NOT NULL,
      content_th text,
      content_en text,
      is_active boolean DEFAULT false,
      conversion_rate numeric(5,4) DEFAULT 0,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Enable RLS on promotional_content
ALTER TABLE promotional_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Anyone can read active promotional content" ON promotional_content;
CREATE POLICY "Anyone can read active promotional content"
  ON promotional_content
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create orders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    CREATE TABLE orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      course_id uuid,
      stripe_session_id text UNIQUE,
      amount_thb numeric(10,2),
      currency text DEFAULT 'thb',
      status text DEFAULT 'pending',
      payment_method text,
      created_at timestamptz DEFAULT now(),
      completed_at timestamptz
    );
    
    -- Add foreign key constraints
    ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    ALTER TABLE orders ADD CONSTRAINT orders_course_id_fkey 
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- Create feedback table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'feedback') THEN
    CREATE TABLE feedback (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      course_id uuid,
      rating integer,
      comment text,
      is_public boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
    );
    
    -- Add foreign key constraints
    ALTER TABLE feedback ADD CONSTRAINT feedback_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    ALTER TABLE feedback ADD CONSTRAINT feedback_course_id_fkey 
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Users can manage own feedback" ON feedback;
CREATE POLICY "Users can manage own feedback"
  ON feedback
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Create user_inquiries table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_inquiries') THEN
    CREATE TABLE user_inquiries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL,
      name text,
      phone text,
      message text,
      course_interest text,
      language_preference text DEFAULT 'th',
      created_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT user_inquiries_language_preference_check CHECK ((language_preference = ANY (ARRAY['th'::text, 'en'::text])))
    );
  END IF;
END $$;

-- Enable RLS on user_inquiries
ALTER TABLE user_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Anyone can create inquiries" ON user_inquiries;
CREATE POLICY "Anyone can create inquiries"
  ON user_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create page_analytics table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'page_analytics') THEN
    CREATE TABLE page_analytics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type text NOT NULL,
      section text,
      user_agent text,
      ip_address inet,
      created_at timestamptz DEFAULT now() NOT NULL,
      user_id uuid,
      session_id text,
      page_url text,
      referrer text,
      device_type text,
      conversion_event text
    );
    
    -- Add foreign key constraint
    ALTER TABLE page_analytics ADD CONSTRAINT page_analytics_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on page_analytics
ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Anyone can create analytics" ON page_analytics;
CREATE POLICY "Anyone can create analytics"
  ON page_analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create privacy_consents table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'privacy_consents') THEN
    CREATE TABLE privacy_consents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      consent_type text NOT NULL,
      consented boolean NOT NULL,
      ip_address inet,
      user_agent text,
      created_at timestamptz DEFAULT now()
    );
    
    -- Add foreign key constraint
    ALTER TABLE privacy_consents ADD CONSTRAINT privacy_consents_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on privacy_consents
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Users can manage own privacy consents" ON privacy_consents;
CREATE POLICY "Users can manage own privacy consents"
  ON privacy_consents
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Create translations table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'translations') THEN
    CREATE TABLE translations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      language text NOT NULL,
      namespace text NOT NULL DEFAULT 'translation',
      key text NOT NULL,
      value text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Create unique index
    CREATE UNIQUE INDEX translations_lang_ns_key_idx ON translations (language, namespace, key);
  END IF;
END $$;

-- Enable RLS on translations
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Anyone can read translations" ON translations;
CREATE POLICY "Anyone can read translations"
  ON translations
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage translations" ON translations;
CREATE POLICY "Authenticated users can manage translations"
  ON translations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create or replace function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, language_preference)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', new.email), 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample data for testing
INSERT INTO translations (language, namespace, key, value) VALUES
  ('th', 'common', 'welcome', 'ยินดีต้อนรับ'),
  ('en', 'common', 'welcome', 'Welcome'),
  ('th', 'common', 'courses', 'คอร์สเรียน'),
  ('en', 'common', 'courses', 'Courses'),
  ('th', 'common', 'pricing', 'ราคา'),
  ('en', 'common', 'pricing', 'Pricing'),
  ('th', 'common', 'login', 'เข้าสู่ระบบ'),
  ('en', 'common', 'login', 'Login'),
  ('th', 'common', 'register', 'สมัครสมาชิก'),
  ('en', 'common', 'register', 'Register')
ON CONFLICT (language, namespace, key) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (title_th, title_en, description_th, description_en, level, price_thb, duration_hours, lessons_count, instructor_name) VALUES
  ('ภาษาอังกฤษเบื้องต้น', 'English Basics', 'เรียนรู้พื้นฐานภาษาอังกฤษ', 'Learn English fundamentals', 'Beginner', 399.00, 20, 10, 'Teacher Sarah'),
  ('ภาษาอังกฤษระดับกลาง', 'Intermediate English', 'พัฒนาทักษะภาษาอังกฤษระดับกลาง', 'Develop intermediate English skills', 'Intermediate', 599.00, 30, 15, 'Teacher John'),
  ('ภาษาอังกฤษขั้นสูง', 'Advanced English', 'เชี่ยวชาญภาษาอังกฤษระดับสูง', 'Master advanced English skills', 'Advanced', 999.00, 40, 20, 'Teacher Emma')
ON CONFLICT (id) DO NOTHING;

-- Insert sample testimonials
INSERT INTO testimonials (name_th, name_en, quote_th, quote_en, rating, age, occupation, course_taken, is_featured) VALUES
  ('สมชาย ใจดี', 'Somchai Jaidee', 'คอร์สนี้ช่วยให้ผมพูดภาษาอังกฤษได้คล่องขึ้นมาก', 'This course helped me speak English much more fluently', 5, 28, 'Software Engineer', 'English Basics', true),
  ('นิดา สวยงาม', 'Nida Suayngam', 'ครูสอนดีมาก เข้าใจง่าย', 'The teacher is excellent and easy to understand', 5, 25, 'Marketing Manager', 'Intermediate English', true),
  ('ประยุทธ์ เก่งมาก', 'Prayuth Kengmak', 'แนะนำเลยครับ คุ้มค่ามาก', 'Highly recommended, very worth it', 5, 32, 'Business Owner', 'Advanced English', false)
ON CONFLICT (id) DO NOTHING;