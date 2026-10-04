/** Deterministic, non-Spanish replies used when the language model is unavailable. */
export function generateDutchActorFallback(userMessage: string): {
  replyText: string;
  meaning: string;
  proposedAction: null;
} {
  const lower = userMessage.toLowerCase();

  if (lower.includes('koffie') || lower.includes('thee') || lower.includes('melk')) {
    return {
      replyText: 'Natuurlijk. Wilt u er melk of suiker bij?',
      meaning: 'Of course. Would you like milk or sugar with that?',
      proposedAction: null,
    };
  }

  if (lower.includes('richting') || lower.includes('metro') || lower.includes('station')) {
    return {
      replyText: 'Naar waar wilt u reizen? Dan kijk ik even met u mee.',
      meaning: 'Where would you like to travel? I will check it with you.',
      proposedAction: null,
    };
  }

  if (lower.includes('pakje') || lower.includes('pakket')) {
    return {
      replyText: 'Komt u een pakje ophalen of versturen?',
      meaning: 'Are you here to pick up or send a parcel?',
      proposedAction: null,
    };
  }

  return {
    replyText: 'Goeiedag! Waarmee kan ik u helpen?',
    meaning: 'Good day! How can I help you?',
    proposedAction: null,
  };
}
