const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
  name: 'set-selectable-classes',
  description: 'Configure which classes are available for selection (Admin only)',
  async execute(message, isSlashCommand = false) {
    const interaction = isSlashCommand ? message : null;
    const member = isSlashCommand ? interaction.member : message.member;
    const guild = isSlashCommand ? interaction.guild : message.guild;

    // Check if user has admin permissions
    if (!member.permissions.has('Administrator')) {
      const reply = { 
        content: 'You need Administrator permissions to use this command.',
        ephemeral: true
      };
      return isSlashCommand ? interaction.reply(reply) : message.reply(reply);
    }

    try {
      // Read the current selectable classes
      const configPath = path.join(__dirname, '..', 'config', 'selectableClasses.json');
      const selectableClasses = require('../config/selectableClasses.json');

      // Get all text channels except general
      const allChannels = guild.channels.cache
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
        const reply = { 
          content: 'No text channels found!',
          ephemeral: true
        };
        return isSlashCommand ? interaction.reply(reply) : message.reply(reply);
      }

      // Split channels into chunks of 25
      const channelChunks = [];
      for (let i = 0; i < allChannels.length; i += 25) {
        channelChunks.push(allChannels.slice(i, i + 25));
      }

      // Create a row with a select menu for each chunk
      const rows = channelChunks.map((chunk, index) => 
        new ActionRowBuilder()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`admin-class-select-${index}`)
              .setPlaceholder(`Select classes (Group ${index + 1})`)
              .setMinValues(0)
              .setMaxValues(chunk.length)
              .addOptions(chunk)
          )
      );

      const reply = { 
        content: 'Select which classes should be available for users to join:',
        components: rows,
        ephemeral: true
      };
      return isSlashCommand ? interaction.reply(reply) : message.reply(reply);

    } catch (error) {
      console.error(error);
      const reply = { 
        content: 'An error occurred while processing your request.',
        ephemeral: true
      };
      return isSlashCommand ? interaction.reply(reply) : message.reply(reply);
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
      // Get all current selections from all menus
      const allSelections = [];
      const components = interaction.message.components;
      
      for (const row of components) {
        const menu = row.components[0];
        const menuId = menu.customId;
        if (menuId === interaction.customId) {
          // This is the menu that was just interacted with
          allSelections.push(...interaction.values);
        } else {
          // Get the selected values from other menus
          const selectedOptions = menu.options.filter(opt => opt.default);
          allSelections.push(...selectedOptions.map(opt => opt.value));
        }
      }

      // Update the valid array with selected values
      const newValid = [...new Set(allSelections)]; // Remove duplicates

      // Create/verify roles and apply them to channels
      for (const className of newValid) {
        // Find or create role
        let role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === className);
        if (!role) {
          role = await interaction.guild.roles.create({
            name: className,
            reason: 'Created for class selection system'
          });
        }

        // Find channel and update permissions
        const channel = interaction.guild.channels.cache.find(
          ch => ch.name.toLowerCase() === className
        );
        
        if (channel) {
          await channel.permissionOverwrites.edit(role, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
        }
      }

      // Update the message to show current selections
      const updatedRows = components.map(row => {
        const menu = row.components[0];
        const updatedOptions = menu.options.map(opt => ({
          ...opt,
          default: newValid.includes(opt.value)
        }));
        menu.options = updatedOptions;
        return row;
      });

      await interaction.update({
        content: `Updated selectable classes to: ${newValid.join(', ') || 'none'}`,
        components: updatedRows,
        ephemeral: true
      });

      // Update the JSON file
      const configPath = path.join(__dirname, '..', 'config', 'selectableClasses.json');
      await fs.writeFile(
        configPath,
        JSON.stringify({ valid: newValid }, null, 2)
      );

    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: 'An error occurred while updating selectable classes.',
        ephemeral: true 
      });
    }
  }
};
