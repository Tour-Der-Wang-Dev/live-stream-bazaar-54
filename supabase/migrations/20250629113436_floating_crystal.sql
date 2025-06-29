/*
  # English Learning Platform Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `age` (integer)
      - `occupation` (text)
      - `language_preference` (text, default 'student')
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `courses`
      - `id` (uuid, primary key)
      - `title_th` (text)
      - `title_en` (text)
      - `description_th` (text)
      - `description_en` (text)
      - `level` (text)
      - `image_url` (text)
      - `price` (numeric)
      - `duration_weeks` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `price_thb` (numeric)
      - `duration_hours` (integer)
      - `lessons_count` (integer)
      - `difficulty_level` (text)
      - `is_premium` (boolean)
      - `preview_video_url` (text)
      - `instructor_name` (text)

    - `user_courses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `course_id` (uuid, references courses)
      - `enrolled_at` (timestamp)
      - `completed_at` (timestamp)
      - `progress_percentage` (integer)
      - `payment_status` (text)

    - `testimonials`
      - `id` (uuid, primary key)
      - `name_th` (text)
      - `name_en` (text)
      - `quote_th` (text)
      - `quote_en` (text)
      - `image_url` (text)
      - `rating` (integer)
      - `course_completed` (text)
      - `created_at` (timestamp)
      - `age` (integer)
      - `occupation` (text)
      - `course_taken` (text)
      - `is_featured` (boolean)
      - `video_url` (text)

    - `promotional_content`
      - `id` (uuid, primary key)
      - `content_type` (text)
      - `variant_name` (text)
      - `content_th` (text)
      - `content_en` (text)
      - `is_active` (boolean)
      - `conversion_rate` (numeric)
      - `created_at` (timestamp)

    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `course_id` (uuid, references courses)
      - `stripe_session_id` (text)
      - `amount_thb` (numeric)
      - `currency` (text)
      - `status` (text)
      - `payment_method` (text)
      - `created_at` (timestamp)
      - `completed_at` (timestamp)

    - `feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `course_id` (uuid, references courses)
      - `rating` (integer)
      - `comment` (text)
      - `is_public` (boolean)
      - `created_at` (timestamp)

    - `user_inquiries`
      - `id` (uuid, primary key)
      - `email` (text)
      - `name` (text)
      - `phone` (text)
      - `message` (text)
      - `course_interest` (text)
      - `language_preference` (text)
      - `created_at` (timestamp)

    - `page_analytics`
      - `id` (uuid, primary key)
      - `event_type` (text)
      - `section` (text)
      - `user_agent` (text)
      - `ip_address` (inet)
      - `created_at` (timestamp)
      - `user_id` (uuid, references profiles)
      - `session_id` (text)
      - `page_url` (text)
      - `referrer` (text)
      - `device_type` (text)
      - `conversion_event` (text)

    - `privacy_consents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `consent_type` (text)
      - `consented` (boolean)
      - `ip_address` (inet)
      - `user_agent` (text)
      - `created_at` (timestamp)

    - `translations`
      - `id` (uuid, primary key)
      - `language` (text)
      - `namespace` (text)
      - `key` (text)
      - `value` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
    - Add policies for public access where appropriate
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  age integer,
  occupation text,
  language_preference text DEFAULT 'student',
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and edit own profile"
  ON profiles
  FOR ALL
  TO public
  USING (auth.uid() = id);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
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

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON courses
  FOR SELECT
  TO public
  USING (true);

-- Create user_courses table
CREATE TABLE IF NOT EXISTS user_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_percentage integer DEFAULT 0,
  payment_status text DEFAULT 'free',
  UNIQUE(user_id, course_id)
);

ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON user_courses
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
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

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view testimonials"
  ON testimonials
  FOR SELECT
  TO public
  USING (true);

-- Create promotional_content table
CREATE TABLE IF NOT EXISTS promotional_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  variant_name text NOT NULL,
  content_th text,
  content_en text,
  is_active boolean DEFAULT false,
  conversion_rate numeric(5,4) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promotional_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promotional content"
  ON promotional_content
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  stripe_session_id text UNIQUE,
  amount_thb numeric(10,2),
  currency text DEFAULT 'thb',
  status text DEFAULT 'pending',
  payment_method text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  rating integer,
  comment text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback"
  ON feedback
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Create user_inquiries table
CREATE TABLE IF NOT EXISTS user_inquiries (
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

ALTER TABLE user_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create inquiries"
  ON user_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create page_analytics table
CREATE TABLE IF NOT EXISTS page_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  section text,
  user_agent text,
  ip_address inet,
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  page_url text,
  referrer text,
  device_type text,
  conversion_event text
);

ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create analytics"
  ON page_analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create privacy_consents table
CREATE TABLE IF NOT EXISTS privacy_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  consented boolean NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own privacy consents"
  ON privacy_consents
  FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Create translations table
CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL,
  namespace text NOT NULL DEFAULT 'translation',
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS translations_lang_ns_key_idx ON translations (language, namespace, key);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations"
  ON translations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage translations"
  ON translations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, language_preference)
  VALUES (new.id, new.raw_user_meta_data->>'name', 'student');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();