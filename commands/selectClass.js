const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const selectableClasses = require('../config/selectableClasses.json');

module.exports = {
  name: 'select-classes',
  description: 'Select your classes',
  async execute(message, isSlashCommand = false) {
    const interaction = isSlashCommand ? message : null;
    const guild = isSlashCommand ? interaction.guild : message.guild;
    const member = isSlashCommand ? interaction.member : message.member;
    
    // Get user's current roles that match selectable classes
    const userClassRoles = member.roles.cache
      .filter(role => selectableClasses.valid.includes(role.name.toLowerCase()))
      .map(role => role.name.toLowerCase());
    
    const availableChannels = guild.channels.cache
      .filter(channel => 
        channel.type === 0 &&
        channel.name.toLowerCase() !== 'general' &&
        selectableClasses.valid.includes(channel.name.toLowerCase())
      )
      .map(channel => ({
        label: channel.name,
        value: channel.name.toLowerCase(),
        default: userClassRoles.includes(channel.name.toLowerCase())
      }));

    if (availableChannels.length === 0) {
      const reply = { content: 'No available classes found!', ephemeral: true };
      return isSlashCommand ? interaction.reply(reply) : message.reply(reply);
    }

    // Split channels into chunks of 25
    const channelChunks = [];
    for (let i = 0; i < availableChannels.length; i += 25) {
      channelChunks.push(availableChannels.slice(i, i + 25));
    }

    // Create a row with a select menu for each chunk
    const rows = channelChunks.map((chunk, index) => 
      new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`class-select-${index}`)
            .setPlaceholder(`Select classes (Group ${index + 1})`)
            .setMinValues(0)
            .setMaxValues(chunk.length)
            .addOptions(chunk)
        )
    );

    const reply = { 
      content: 'Select which classes you want to join:', 
      components: rows,
      ephemeral: true 
    };
    return isSlashCommand ? interaction.reply(reply) : message.reply(reply);
  }
};
