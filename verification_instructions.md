# Verification Instructions

Follow these steps before you begin coding, don't create any unnecessary files.

Follow the architecture EXACTLY.
Do not invent new patterns.
Do not change other components unless explicitly asked.
Do not rename variables or functions.

If unsure, ASK before generating code.
Never assume functionality not mentioned.

Generate code that can run as-is.
Avoid pseudocode.
Avoid placeholder syntax.

Use existing models and interfaces EXACTLY as defined.

Tell me exactly where the changes have to be made, always give me the root path of each file that is to be created/modified.

Here is the SQL code, colour scheme and MVVM architecture rules for your reference.
/component is for reusable UI components
/app is for routing
refer to /AuthUI/profileSetupScreen and /app/profile-setup.tsx to get a better understanding.
Use ONLY: #9DE2D0, #C8ADD6, #D4E5AE, #EB8F80, #FADE9F, #FFFFFF.

1. Layering Rules (MVVM Structure)
   Use three strict layers: View, ViewModel, Model (Service + Repository).
   View:
   Only handles layout, styles, navigation, and collecting user input.
   Must not call the database / Supabase / HTTP directly.
   Must not contain business rules (e.g., pre‑match limits, 7‑day rules).
   ViewModel:
   Implemented as a class; holds UI state and UI interaction logic.
   Receives Services via constructor injection; must not call Repositories or DB directly.
   Must not reference or manipulate React components / DOM.
   Service:
   Implements core business rules and flows (pre‑match limits, relationship stages, AI risk rules, application process).
   Can combine multiple Repositories; decides “what to fetch, how to compute, what to store”.
   Repository:
   Only handles data access (CRUD, Supabase queries, table/field names).
   Contains no business rules (knows nothing about 3/5/7‑day constraints).

2. Data Binding Rules
   All ViewModel properties must be observable (e.g., MobX makeAutoObservable(this)).
   Views must be wrapped with an observer (e.g., observer(Component)) so they automatically subscribe to the ViewModel.
   View ↔ ViewModel interaction:
   Display: Views read observable properties only, e.g. vm.elderProfiles, vm.isLoading, vm.errorMessage, vm.currentUser.
   Actions: Views call ViewModel methods only, e.g. vm.loadElders(), vm.expressInterest(), vm.login(), vm.saveProfile().
   When Services / Repositories return data, only the ViewModel is allowed to update its observable properties; Views must not store business state.
   Views never manually “refresh” the UI; they bind to ViewModel state, and any state change automatically re-renders via data binding.

3. Business Logic Placement Rules
   Core business rules (Domain Logic) must live in Services:
   Examples:
   Youth active pre‑match ≤ 3, elder ≤ 5.
   Pre‑match ≥ 7 days before application; after 14 days prompt a decision.
   Motivation letter 100–1000 chars; required fields not empty.
   Services return clear results or error codes, not UI messages.
   ViewModel holds presentation logic:
   Calls Services and interprets results / error codes.
   Maps them into UI state, e.g. canExpressInterest, canApplyFormally, applicationStatus, errorMessage.
   Decides when to trigger navigation, but does not implement routing itself.
   View renders based only on ViewModel state:
   Must not contain conditions like if (stage === 'Stage1'); instead, read flags such as vm.canStartVideoCall.
   Must not re‑implement validation rules; all rules come from Service + ViewModel.

4. Data Access and Call Chain Rules
   The only valid call chain is:
   View → ViewModel → Service → Repository → Supabase/API.
   Any DB / Supabase / HTTP call is allowed only in a Repository.
   Services can call Repositories, but not Views or ViewModels.
   ViewModels can call Services, but not Repositories or DB directly.
   Views can access only ViewModels, never Services / Repositories / DB.
   Example (Express Interest in “Adopt Elderly” use case):
   View: onPress={() => vm.expressInterest(elderId)}
   ViewModel: expressInterest() → matchingService.expressInterest(youthId, elderId)
   Service: enforces 3/5 pre‑match limits, creates pre‑match, sends notification → calls multiple Repositories.
   Repository: executes Supabase queries.

5. State Sharing and Reuse Rules
   Shared real‑time state must be owned by the appropriate ViewModel:
   Chat / unread counts → CommunicationViewModel
   Relationship stage / feature unlocks → StageViewModel
   Safety risks / AI analysis → SafetyViewModel
   Multiple Views (different screens, or mobile + web) must bind to the same ViewModel instance or store; they must not each keep their own duplicated copy of that state.
   ViewModels must not hold references to React components or Views—only data and methods.

6. Form and Input Binding Rules
   Form fields (login, complete profile, application form) must be two‑way bound to the ViewModel:
   ViewModel holds formData or individual field properties.
   Inputs use value={vm.field} and onChange={value => vm.setField(value)}.
   Basic input validation (empty checks, format) can be done in the ViewModel (to control button disabled state, error display).
   Business‑rule validation (length limits, stage constraints) must be implemented in Services; the ViewModel calls the Service and maps the result into UI state.

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activities (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
relationship_id uuid NOT NULL,
stage text NOT NULL CHECK (stage = ANY (ARRAY['getting_acquainted'::text, 'building_trust'::text, 'family_bond'::text, 'full_adoption'::text])),
title text NOT NULL,
description text NOT NULL,
created_by text NOT NULL CHECK (created_by = ANY (ARRAY['system'::text, 'ngo'::text, 'admin'::text, 'ai'::text, 'user'::text])),
is_completed boolean DEFAULT false,
youth_signed boolean DEFAULT false,
elderly_signed boolean DEFAULT false,
created_at timestamp with time zone DEFAULT now(),
completed_at timestamp with time zone,
completion_mode text NOT NULL DEFAULT 'ai'::text CHECK (completion_mode = ANY (ARRAY['ai'::text, 'manual'::text, 'hybrid'::text])),
CONSTRAINT activities_pkey PRIMARY KEY (id),
CONSTRAINT activities_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id)
);
CREATE TABLE public.advisors (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
user_id uuid,
name character varying NOT NULL,
email character varying,
phone character varying,
specialization character varying,
languages ARRAY DEFAULT ARRAY['English'::text],
status character varying DEFAULT 'available'::character varying CHECK (status::text = ANY (ARRAY['available'::character varying, 'busy'::character varying, 'offline'::character varying]::text[])),
current_workload integer DEFAULT 0,
max_workload integer DEFAULT 10,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT advisors_pkey PRIMARY KEY (id),
CONSTRAINT advisors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ai_suggestions (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
relationship_id uuid NOT NULL,
suggestion_type text NOT NULL CHECK (suggestion_type = ANY (ARRAY['activity'::text, 'conversation_topic'::text])),
activity_title text,
activity_description text,
topic_text text,
topic_for_stage text CHECK (topic_for_stage = ANY (ARRAY['getting_to_know'::text, 'trial_period'::text, 'official_ceremony'::text, 'family_life'::text])),
is_used boolean DEFAULT false,
generated_at timestamp with time zone DEFAULT now(),
CONSTRAINT ai_suggestions_pkey PRIMARY KEY (id),
CONSTRAINT ai_suggestions_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id)
);
CREATE TABLE public.applications (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
youth_id uuid NOT NULL,
elderly_id uuid NOT NULL,
motivation_letter text NOT NULL,
status text DEFAULT 'pending_review'::text CHECK (status = ANY (ARRAY['pending_interest'::text, 'pre_chat_active'::text, 'pending_review'::text, 'info_requested'::text, 'approved'::text, 'both_accepted'::text, 'rejected'::text, 'withdrawn'::text])),
ngo_reviewer_id uuid,
ngo_notes text,
youth_decision text DEFAULT 'pending'::text CHECK (youth_decision = ANY (ARRAY['pending'::text, 'accept'::text, 'decline'::text])),
elderly_decision text DEFAULT 'pending'::text CHECK (elderly_decision = ANY (ARRAY['pending'::text, 'accept'::text, 'decline'::text])),
applied_at timestamp with time zone DEFAULT now(),
reviewed_at timestamp with time zone,
CONSTRAINT applications_pkey PRIMARY KEY (id),
CONSTRAINT applications_youth_id_fkey FOREIGN KEY (youth_id) REFERENCES public.users(id),
CONSTRAINT applications_elderly_id_fkey FOREIGN KEY (elderly_id) REFERENCES public.users(id),
CONSTRAINT applications_ngo_reviewer_id_fkey FOREIGN KEY (ngo_reviewer_id) REFERENCES public.users(id)
);
CREATE TABLE public.calendar_events (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
relationship_id uuid NOT NULL,
creator_id uuid NOT NULL,
title text NOT NULL,
description text,
event_type text NOT NULL CHECK (event_type = ANY (ARRAY['meetup'::text, 'birthday'::text, 'anniversary'::text, 'activity'::text, 'other'::text])),
event_date date NOT NULL,
event_time time without time zone,
location text,
reminder_sent boolean DEFAULT false,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT calendar_events_pkey PRIMARY KEY (id),
CONSTRAINT calendar_events_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id),
CONSTRAINT calendar_events_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);
CREATE TABLE public.categories (
id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
name character varying NOT NULL,
icon character varying,
description text,
created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.consultation_requests (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
requester_id uuid NOT NULL,
partner_id uuid,
relationship_id uuid,
consultation_type character varying NOT NULL,
preferred_method character varying DEFAULT 'video_call'::character varying CHECK (preferred_method::text = ANY (ARRAY['video_call'::character varying, 'phone'::character varying, 'in_person'::character varying, 'chat'::character varying]::text[])),
preferred_datetime timestamp with time zone,
concern_description text NOT NULL,
urgency character varying DEFAULT 'normal'::character varying CHECK (urgency::text = ANY (ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying]::text[])),
status character varying DEFAULT 'pending_assignment'::character varying CHECK (status::text = ANY (ARRAY['pending_assignment'::character varying, 'assigned'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'dismissed'::character varying]::text[])),
assigned_advisor_id uuid,
assigned_at timestamp with time zone,
assigned_by uuid,
resolution_notes text,
dismissed_reason text,
completed_at timestamp with time zone,
submitted_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT consultation_requests_pkey PRIMARY KEY (id),
CONSTRAINT consultation_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id),
CONSTRAINT consultation_requests_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.users(id),
CONSTRAINT consultation_requests_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id),
CONSTRAINT consultation_requests_assigned_advisor_id_fkey FOREIGN KEY (assigned_advisor_id) REFERENCES public.advisors(id),
CONSTRAINT consultation_requests_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
CREATE TABLE public.diary_entries (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
user_id uuid NOT NULL,
relationship_id uuid NOT NULL,
content text,
mood text CHECK (mood = ANY (ARRAY['happy'::text, 'sad'::text, 'neutral'::text, 'excited'::text, 'anxious'::text, 'grateful'::text])),
is_private boolean DEFAULT true,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT diary_entries_pkey PRIMARY KEY (id),
CONSTRAINT diary_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT diary_entries_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id)
);
CREATE TABLE public.keyword_detections (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
keyword_id integer NOT NULL,
message_id uuid NOT NULL,
detected_at timestamp with time zone DEFAULT now(),
context text,
CONSTRAINT keyword_detections_pkey PRIMARY KEY (id),
CONSTRAINT fk_keyword FOREIGN KEY (keyword_id) REFERENCES public.keywords(id),
CONSTRAINT fk_message FOREIGN KEY (message_id) REFERENCES public.messages(id)
);
CREATE TABLE public.keyword_suggestions (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
keyword text NOT NULL,
category text NOT NULL,
severity text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
detection_count_last_7_days integer DEFAULT 0,
status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT keyword_suggestions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.keywords (
id integer NOT NULL DEFAULT nextval('keywords_id_seq'::regclass),
keyword character varying NOT NULL,
category_id integer NOT NULL,
created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
is_active boolean DEFAULT true,
severity text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
CONSTRAINT keywords_pkey PRIMARY KEY (id),
CONSTRAINT keywords_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.media (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
uploader_id uuid NOT NULL,
relationship_id uuid NOT NULL,
media_type text NOT NULL CHECK (media_type = ANY (ARRAY['photo'::text, 'voice'::text, 'video'::text, 'document'::text])),
media_category text NOT NULL CHECK (media_category = ANY (ARRAY['family_album'::text, 'diary_attachment'::text, 'chat_media'::text, 'other'::text])),
file_url text NOT NULL,
caption text,
tags ARRAY,
uploaded_at timestamp with time zone DEFAULT now(),
memory_id uuid,
CONSTRAINT media_pkey PRIMARY KEY (id),
CONSTRAINT media_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id),
CONSTRAINT media_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id),
CONSTRAINT media_memory_id_fkey FOREIGN KEY (memory_id) REFERENCES public.memories(id)
);
CREATE TABLE public.memories (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
relationship_id uuid NOT NULL,
uploader_id uuid NOT NULL,
caption text,
thumbnail_url text NOT NULL,
media_count integer DEFAULT 1,
uploaded_at timestamp with time zone DEFAULT now(),
CONSTRAINT memories_pkey PRIMARY KEY (id),
CONSTRAINT memories_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id),
CONSTRAINT memories_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id)
);
CREATE TABLE public.messages (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
sender_id uuid NOT NULL,
receiver_id uuid NOT NULL,
application_id uuid,
relationship_id uuid,
message_type text NOT NULL CHECK (message_type = ANY (ARRAY['text'::text, 'voice'::text, 'image'::text, 'video'::text, 'video_call'::text])),
content text,
media_url text,
call_duration_minutes integer,
is_read boolean DEFAULT false,
sent_at timestamp with time zone DEFAULT now(),
CONSTRAINT messages_pkey PRIMARY KEY (id),
CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id),
CONSTRAINT messages_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
CONSTRAINT messages_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id)
);
CREATE TABLE public.notifications (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
user_id uuid NOT NULL,
type text NOT NULL CHECK (type = ANY (ARRAY['stage_milestone'::text, 'new_message'::text, 'calendar_reminder'::text, 'safety_alert'::text, 'admin_notice'::text, 'application_update'::text, 'new_interest'::text, 'interest_accepted'::text, 'interest_rejected'::text, 'application_submitted'::text, 'application_under_review'::text, 'application_approved'::text, 'application_rejected'::text, 'pre_chat_ending_soon'::text, 'relationship_accepted'::text, 'relationship_ended'::text, 'profile_viewed'::text, 'platform_update'::text])),
title text NOT NULL,
message text NOT NULL,
is_read boolean DEFAULT false,
created_at timestamp with time zone DEFAULT now(),
reference_id uuid,
reference_table text,
CONSTRAINT notifications_pkey PRIMARY KEY (id),
CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.relationships (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
youth_id uuid NOT NULL,
elderly_id uuid NOT NULL,
application_id uuid NOT NULL,
current_stage text DEFAULT 'getting_to_know'::text CHECK (current_stage = ANY (ARRAY['getting_to_know'::text, 'trial_period'::text, 'official_ceremony'::text, 'family_life'::text])),
stage_start_date timestamp with time zone DEFAULT now(),
stage_metrics jsonb DEFAULT '{"meetings": 0, "active_days": 0, "video_calls": 0, "message_count": 0, "requirements_met": false, "progress_percentage": 0}'::jsonb,
status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'ended'::text])),
updated_at timestamp with time zone DEFAULT now(),
family_name text,
ceremony_date date,
certificate_url text,
end_request_status text DEFAULT 'none'::text CHECK (end_request_status = ANY (ARRAY['none'::text, 'pending_cooldown'::text, 'under_review'::text, 'approved'::text, 'rejected'::text])),
end_request_by uuid,
end_request_reason text,
end_request_at timestamp with time zone,
end_admin_notes text,
created_at timestamp with time zone DEFAULT now(),
ended_at timestamp with time zone,
current_activity_id uuid,
feature_flags jsonb DEFAULT '{"text": true, "diary": false, "scheduling": false, "video_call": false, "photo_share": false}'::jsonb,
CONSTRAINT relationships_pkey PRIMARY KEY (id),
CONSTRAINT relationships_youth_id_fkey FOREIGN KEY (youth_id) REFERENCES public.users(id),
CONSTRAINT relationships_elderly_id_fkey FOREIGN KEY (elderly_id) REFERENCES public.users(id),
CONSTRAINT relationships_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
CONSTRAINT relationships_end_request_by_fkey FOREIGN KEY (end_request_by) REFERENCES public.users(id),
CONSTRAINT relationships_current_activity_id_fkey FOREIGN KEY (current_activity_id) REFERENCES public.activities(id)
);
CREATE TABLE public.safety_incidents (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
relationship_id uuid NOT NULL,
reporter_id uuid,
reported_user_id uuid,
incident_type text NOT NULL CHECK (incident_type = ANY (ARRAY['financial_request'::text, 'negative_sentiment'::text, 'harassment'::text, 'abuse'::text, 'inappropriate_content'::text, 'other'::text])),
severity text NOT NULL CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
description text NOT NULL,
evidence jsonb,
status text DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'under_review'::text, 'resolved'::text, 'false_positive'::text])),
assigned_admin_id uuid,
admin_notes text,
admin_action_taken text,
detected_at timestamp with time zone DEFAULT now(),
resolved_at timestamp with time zone,
CONSTRAINT safety_incidents_pkey PRIMARY KEY (id),
CONSTRAINT safety_incidents_relationship_id_fkey FOREIGN KEY (relationship_id) REFERENCES public.relationships(id),
CONSTRAINT safety_incidents_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id),
CONSTRAINT safety_incidents_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.users(id),
CONSTRAINT safety_incidents_assigned_admin_id_fkey FOREIGN KEY (assigned_admin_id) REFERENCES public.users(id)
);
CREATE TABLE public.stage_features (
stage text NOT NULL CHECK (stage = ANY (ARRAY['getting_to_know'::text, 'trial_period'::text, 'official_ceremony'::text, 'family_life'::text])),
feature_flags jsonb NOT NULL,
CONSTRAINT stage_features_pkey PRIMARY KEY (stage)
);
CREATE TABLE public.users (
id uuid NOT NULL DEFAULT uuid_generate_v4(),
user_type text NOT NULL CHECK (user_type = ANY (ARRAY['youth'::text, 'elderly'::text, 'admin'::text])),
email text NOT NULL UNIQUE,
phone text,
full_name text NOT NULL,
date_of_birth date NOT NULL,
gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text])),
location text,
languages ARRAY,
profile_photo_url text,
verification_status text DEFAULT 'pending'::text CHECK (verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])),
is_active boolean DEFAULT true,
profile_data jsonb,
created_at timestamp with time zone DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
CONSTRAINT users_pkey PRIMARY KEY (id)
);

File Structure:
HomeSweetHome/
│
├── View/
│ ├── Mobile/
│ │ ├── app/ # Expo Router (routes)
│ │ ├── AuthUI/ # 📁 Folder
│ │ ├── StageUI/ # 📁 Folder
│ │ ├── FamilyViewUI/ # 📁 Folder
│ │ ├── MatchingUI/ # 📁 Folder
│ │ ├── CommunicationUI/ # 📁 Folder
│ │ └── components/ # (reusable ui component)
│ │
│ └── Web/
│ └── src/components/
│ ├── AdminUI/ # 📁 Folder
│ └── SafetyUI/ # 📁 Folder
│
├── ViewModel/
│ ├── AuthViewModel/ # 📁 Folder
│ ├── MatchingViewModel/ # 📁 Folder
│ ├── StageViewModel/ # 📁 Folder
│ ├── FamilyViewModel/ # 📁 Folder
│ ├── CommunicationViewModel/ # 📁 Folder
│ ├── AdminViewModel/ # 📁 Folder
│ ├── SafetyViewModel/ # 📁 Folder
│ ├── index.ts
│ └── package.json
│
├── Model/
│ ├── Service/
│ │ ├── APIService/ # 📁 Folder
│ │ └── CoreService/ # 📁 Folder
│ │
│ ├── Repository/
│ │ ├── UserRepository/ # 📁 Folder
│ │ └── AdminRepository/ # 📁 Folder
│ │
│ ├── types/
│ │ └── index.ts
│ ├── index.ts
│ └── package.json
│
├── pnpm-workspace.yaml
├── turbo.json
└── package.json

Reusability Rules (Reuse First)
Search first, then create
Before building any new UI component, always check directories such as components/ui
If an existing component already satisfies 70% or more of your needs, you should extend or parameterize that component instead of creating a new one that looks similar but has a different name.

Merge similar components
After pulling the latest code from GitHub, if you find two or more components that:
Look similar (buttons, cards, list items, form fields, etc.), or

Behave similarly (confirmation modals, error alerts, loading states)

You must evaluate whether they can be merged into a more generic component, controlled through props for style/text variations.
Duplicate UI patterns across folders are not allowed
(e.g., two almost identical PrimaryButton components).

Clear naming & responsibility-based splitting
Principle: One visual pattern = One base component.
Examples:
All primary buttons → PrimaryButton

All error messages → ErrorMessage

All inputs with label + error → LabeledTextField

Names like BigButton, AnotherButton, BlueButton2 are not allowed.

Maintainability Rules
UI handles presentation only; logic goes into ViewModel / Service
All network requests, database access, and business rules
(e.g., pre-match restrictions, 7-day rules) must be placed in Service / ViewModel.
Views/components should ONLY:
Receive props/state and display data

Call methods exposed by the ViewModel

Components must not directly use Supabase / fetch / axios.

Avoid copy-paste logic
If you write code in a second place that is 80% similar to an earlier one:
Stop and extract that logic into:
a shared ViewModel method, or

a shared component function / hook / util

During review/merge, if duplicate logic is found, refactor it into common code.

Single Responsibility (Small, focused components)
Each component/file should handle exactly one concern:
ProfileInfoForm: only the UI, no saving

ProfileInfoViewModel: handles saving logic and state

When a file grows beyond ~300 lines or holds multiple responsibilities, consider splitting it.

Centralized state management
State related to a single business domain
(e.g., relationship stage, pre-match status, unread counters)
must be stored in the corresponding ViewModel.
Do not let each page maintain its own duplicate copy of the same business state.
If multiple pages need the same state, they must share the same ViewModel or a shared store.

Unified styling and interactions
Repeated styles (button colors, borders, font sizes) must come from a unified theme/style constants file.
New UI designs should align with existing components rather than inventing new styles.

Checkpoints in the Development Process
Before Development
For every new requirement, search in:
components/ui

viewmodels

services

If something similar exists → reuse/extend
If nothing exists → create a new one.

Before Commit (Self-Review)
Check whether your new component is just a slightly modified version of an existing one.
If yes → consider merging.

Check whether you wrote business logic or accessed DB/Service directly in the View.
If yes → move it to ViewModel/Service.

After Merge/Pull
After pulling from GitHub, review:
Did any two similar UI components appear?

Are there two duplicated business logic blocks?

If yes, create a refactor task to merge them into a single implementation.
