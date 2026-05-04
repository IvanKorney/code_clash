CREATE INDEX "matches_winner_id_idx" ON "matches" USING btree ("winner_id");--> statement-breakpoint
CREATE INDEX "matches_loser_id_idx" ON "matches" USING btree ("loser_id");--> statement-breakpoint
CREATE INDEX "rooms_code_idx" ON "rooms" USING btree ("code");--> statement-breakpoint
CREATE INDEX "rooms_status_idx" ON "rooms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_elo_idx" ON "user" USING btree ("elo");