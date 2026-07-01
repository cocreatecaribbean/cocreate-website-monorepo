-- Improve dashboard recent-activity query performance
CREATE INDEX "ProjectActivity_action_createdAt_idx" ON "ProjectActivity"("action", "createdAt");
CREATE INDEX "ProjectActivity_projectId_action_createdAt_idx" ON "ProjectActivity"("projectId", "action", "createdAt");
