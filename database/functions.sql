-- Create function to get issues within bounds
CREATE OR REPLACE FUNCTION get_issues_in_bounds(
  min_lng float,
  min_lat float,
  max_lng float,
  max_lat float
)
RETURNS SETOF issues
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM issues
  WHERE ST_Within(
    location::geometry,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
  )
  ORDER BY created_at DESC;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_issues_in_bounds TO authenticated;
GRANT EXECUTE ON FUNCTION get_issues_in_bounds TO anon; 