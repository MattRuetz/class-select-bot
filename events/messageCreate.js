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

    // Handle select-class command
    if (message.content === '.select-class') {
      const selectClassCommand = client.commands.get('select-class');
      await selectClassCommand.execute(message, false);
      return;
    }

    // Handle set-selectable-classes command
    if (message.content === '.set-selectable-classes') {
      const setSelectableClassesCommand = client.commands.get('set-selectable-classes');
      await setSelectableClassesCommand.execute(message);
      return;
    }
  }
};
