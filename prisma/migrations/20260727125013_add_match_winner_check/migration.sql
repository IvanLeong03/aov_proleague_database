-- AddCheckConstraint
ALTER TABLE "Match"
  ADD CONSTRAINT "match_winner_is_participant"
  CHECK ("winnerTeamId" = "blueTeamId" OR "winnerTeamId" = "redTeamId");
