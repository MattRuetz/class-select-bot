const selectableClasses = require('../config/selectableClasses.json');
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      
      try {
        await command.execute(interaction, true);
      } catch (error) {
        console.error(error);
        await interaction.reply({ 
          content: 'There was an error executing this command!',
          ephemeral: true 
        });
      }
    }
    
    // Handle select menus
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith('class-select-')) {
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

          // Remove duplicates
          const uniqueSelections = [...new Set(allSelections)];

          // Get all current class roles the user has
          const currentClassRoles = interaction.member.roles.cache
            .filter(role => selectableClasses.valid.includes(role.name.toLowerCase()));
          
          // Remove roles that aren't in the new selection
          for (const role of currentClassRoles.values()) {
            if (!uniqueSelections.includes(role.name.toLowerCase())) {
              await interaction.member.roles.remove(role);
            }
          }

          // Add new roles
          for (const selectedClass of uniqueSelections) {
            let role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === selectedClass.toLowerCase());
            
            if (!role) {
              role = await interaction.guild.roles.create({
                name: selectedClass,
                reason: 'Created for class selection system'
              });
            }

            await interaction.member.roles.add(role);
          }

          // Update the message to show current selections
          const updatedRows = components.map(row => {
            const menu = row.components[0];
            return new ActionRowBuilder()
              .addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId(menu.customId)
                  .setPlaceholder(menu.placeholder)
                  .setMinValues(0)
                  .setMaxValues(menu.options.length)
                  .addOptions(
                    menu.options.map(opt => ({
                      label: opt.label,
                      value: opt.value,
                      default: uniqueSelections.includes(opt.value)
                    }))
                  )
              );
          });

          await interaction.update({
            content: `Your class selections have been updated: ${uniqueSelections.join(', ') || 'none'}`,
            components: updatedRows,
            ephemeral: true
          });
        } catch (error) {
          console.error(error);
          await interaction.reply({ 
            content: 'An error occurred while processing your selection.',
            ephemeral: true 
          });
        }
      }
      
      if (interaction.customId.startsWith('admin-class-select-')) {
        const setSelectableClassesCommand = client.commands.get('set-selectable-classes');
        await setSelectableClassesCommand.handleSelection(interaction);
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      const resetClassesCommand = client.commands.get('reset-classes');
      
      switch (interaction.customId) {
        case 'reset-confirm-1':
          await resetClassesCommand.handleFirstConfirmation(interaction);
          break;
        case 'reset-cancel-1':
        case 'reset-cancel-2':
          await resetClassesCommand.handleCancel(interaction);
          break;
        case 'reset-confirm-2':
          await resetClassesCommand.handleFinalConfirmation(interaction);
          break;
      }
    }
  }
};
