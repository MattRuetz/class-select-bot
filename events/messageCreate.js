module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Handle help commands
    if (message.content === '.usherbot' || message.content === '.usherbot-help') {
      const helpCommand = client.commands.get('help');
      await helpCommand.execute(message);
      return;
    }
  }
};
