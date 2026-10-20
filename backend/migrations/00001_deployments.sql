-- A deployment is an organization's own map: a theme (its set of incident
-- types), an area, a status and dates, and a public slug for its reporting
-- link and map. An organization can run several.

-- +goose Up
CREATE TABLE deployments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    name            text NOT NULL,
    -- Unique across the platform: it is the deployment's public URL.
    slug            text NOT NULL UNIQUE,
    description     text,
    -- The English country name, as report locations store it, so a
    -- deployment's map can filter reports by it.
    country         text,
    region          text,
    status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'live', 'closed')),
    starts_at       timestamp,
    ends_at         timestamp,
    created_at      timestamp NOT NULL DEFAULT now(),
    updated_at      timestamp NOT NULL DEFAULT now(),
    CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX deployments_organization_id_idx ON deployments (organization_id);

-- The deployment's theme: the incident types it tracks.
CREATE TABLE deployment_incident_types (
    deployment_id    uuid NOT NULL REFERENCES deployments (id) ON DELETE CASCADE,
    incident_type_id uuid NOT NULL REFERENCES incident_types (id) ON DELETE RESTRICT,
    PRIMARY KEY (deployment_id, incident_type_id)
);

CREATE INDEX deployment_incident_types_incident_type_id_idx
    ON deployment_incident_types (incident_type_id);

-- +goose Down
DROP TABLE deployment_incident_types;
DROP TABLE deployments;
