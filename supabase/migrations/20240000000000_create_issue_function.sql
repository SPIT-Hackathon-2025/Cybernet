-- Create a function to submit a new issue
create or replace function public.submit_issue(
  p_title text,
  p_description text,
  p_category text,
  p_location geometry,
  p_photos text[],
  p_user_id uuid
)
returns public.issues
language plpgsql
security definer
as $$
declare
  v_new_issue issues;
begin
  -- Validate inputs
  if p_title is null or length(trim(p_title)) < 5 then
    raise exception 'Title must be at least 5 characters long';
  end if;

  if p_description is null or length(trim(p_description)) < 20 then
    raise exception 'Description must be at least 20 characters long';
  end if;

  if p_category is null or p_category = '' then
    raise exception 'Category is required';
  end if;

  if p_location is null then
    raise exception 'Location is required';
  end if;

  if p_user_id is null then
    raise exception 'User ID is required';
  end if;

  -- Insert new issue
  insert into public.issues (
    title,
    description,
    category,
    location,
    photos,
    user_id,
    status,
    verification_count
  )
  values (
    trim(p_title),
    trim(p_description),
    p_category,
    p_location,
    coalesce(p_photos, array[]::text[]),
    p_user_id,
    'open',  -- Default status
    0        -- Initial verification count
  )
  returning * into v_new_issue;

  return v_new_issue;
end;
$$;

-- Set appropriate permissions
grant execute on function public.submit_issue to authenticated; 