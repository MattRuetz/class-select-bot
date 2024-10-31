const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
  name: 'set-selectable-classes',
  description: 'Configure which classes are available for selection (Admin only)',
  async execute(message) {
    // Check if user has admin permissions
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('You need Administrator permissions to use this command.');
    }

    try {
      // Read the current selectable classes
      const configPath = path.join(__dirname, '..', 'config', 'selectableClasses.json');
      const selectableClasses = require('../config/selectableClasses.json');

      // Get all text channels except general
      const allChannels = message.guild.channels.cache
        .filter(channel => 
          channel.type === 0 && 
          channel.name.toLowerCase() !== 'general'
        )
        .map(channel => ({
          label: channel.name,
          value: channel.name.toLowerCase(),
          default: selectableClasses.valid.includes(channel.name.toLowerCase())
        }));

      if (allChannels.length === 0) {
        return message.reply('No text channels found!');
      }

      const row = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('admin-class-select')
            .setPlaceholder('Select classes to make selectable')
            .setMinValues(0)
            .setMaxValues(allChannels.length)
            .addOptions(allChannels)
        );

      await message.reply({ 
        content: 'Select which classes should be available for users to join:',
        components: [row]
      });

    } catch (error) {
      console.error(error);
      await message.reply('An error occurred while processing your request.');
    }
  },

  // Add a method to handle the select menu interaction
  async handleSelection(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ 
        content: 'You need Administrator permissions to modify selectable classes.',
        ephemeral: true 
      });
    }

    try {
      // Get all current channel names in the server
      const currentChannels = interaction.guild.channels.cache
        .filter(channel => channel.type === 0)
        .map(channel => channel.name.toLowerCase());

      // Update the valid array with selected values, only including channels that exist
      const newValid = interaction.values.filter(value => currentChannels.includes(value));

      // Update the JSON file
      const configPath = path.join(__dirname, '..', 'config', 'selectableClasses.json');
      await fs.writeFile(
        configPath,
        JSON.stringify({ valid: newValid }, null, 2)
      );

      await interaction.reply({ 
        content: `Updated selectable classes to: ${newValid.join(', ') || 'none'}`,
        ephemeral: true 
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: 'An error occurred while updating selectable classes.',
        ephemeral: true 
      });
    }
  }
};
