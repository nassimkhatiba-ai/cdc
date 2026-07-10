// Accounting model for an agent conversation.
//
// Every model round trip re-processes the entire conversation so far as
// input tokens (that is how LLM APIs bill), so we track:
//   - contextTokens: final conversation size (context-window footprint)
//   - billedInputTokens: sum of conversation size at each round trip
//   - outputTokens: tokens the model itself generates (tool calls / code)
//   - roundTrips: model inference calls needed
const { estimateTokens } = require('./tokens');

class Conversation {
  constructor(systemText) {
    this.contextTokens = estimateTokens(systemText);
    this.billedInputTokens = 0;
    this.outputTokens = 0;
    this.roundTrips = 0;
  }

  // One model inference: model reads full context, emits `generated` text
  // (a tool call or code), then `observed` text (tool result) is appended.
  turn(generated, observed) {
    this.roundTrips += 1;
    this.billedInputTokens += this.contextTokens;
    const gen = estimateTokens(generated);
    this.outputTokens += gen;
    this.contextTokens += gen + estimateTokens(observed);
  }

  stats() {
    return {
      contextTokens: this.contextTokens,
      billedInputTokens: this.billedInputTokens,
      outputTokens: this.outputTokens,
      roundTrips: this.roundTrips,
    };
  }
}

module.exports = { Conversation };
