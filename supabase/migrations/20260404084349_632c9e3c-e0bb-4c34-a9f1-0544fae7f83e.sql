DROP POLICY "Service role can manage virtual cards" ON public.virtual_cards;

CREATE POLICY "Users can delete their own virtual cards"
ON public.virtual_cards FOR DELETE
USING (auth.uid() = user_id);