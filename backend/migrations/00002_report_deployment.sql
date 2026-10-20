-- A public report can arrive through a deployment's reporting link; it then
-- belongs to that deployment and shows on its map. Reports sent through the
-- general form, and every report from before deployments, have none.

-- +goose Up
ALTER TABLE anonymous_incident_reports
    ADD COLUMN deployment_id uuid REFERENCES deployments (id) ON DELETE SET NULL;

CREATE INDEX anonymous_incident_reports_deployment_id_idx
    ON anonymous_incident_reports (deployment_id)
    WHERE deployment_id IS NOT NULL;

-- +goose Down
ALTER TABLE anonymous_incident_reports DROP COLUMN deployment_id;
