const { REST, Routes } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}!`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    const commands = [
      {
        name: 'select-class',
        description: 'Select your classes',
      },
      {
        name: 'set-selectable-classes',
        description: 'Configure which classes are available for selection (Admin only)',
      },
      {
        name: 'help',
        description: 'Show available commands',
      }
    ];

    try {
      console.log('Started refreshing application (/) commands.');
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands },
      );
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  }
};
