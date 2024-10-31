const selectableClasses = require('../config/selectableClasses.json');
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
      if (interaction.customId === 'class-select') {
        try {
          // Get all current class roles the user has
          const currentClassRoles = interaction.member.roles.cache
            .filter(role => selectableClasses.valid.includes(role.name.toLowerCase()));
          
          // Remove roles that aren't in the new selection
          for (const role of currentClassRoles.values()) {
            if (!interaction.values.includes(role.name.toLowerCase())) {
              await interaction.member.roles.remove(role);
            }
          }

          // Add new roles
          for (const selectedClass of interaction.values) {
            let role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === selectedClass.toLowerCase());
            
            if (!role) {
              role = await interaction.guild.roles.create({
                name: selectedClass,
                reason: 'Created for class selection system'
              });
            }

            await interaction.member.roles.add(role);
          }

          const classesJoined = interaction.values.join(', ');
          await interaction.reply({ 
            content: `Your class selections have been updated: ${classesJoined}`,
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
      
      if (interaction.customId === 'admin-class-select') {
        const setSelectableClassesCommand = client.commands.get('set-selectable-classes');
        await setSelectableClassesCommand.handleSelection(interaction);
      }
    }
  }
};
