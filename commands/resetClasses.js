const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const selectableClasses = require('../config/selectableClasses.json');

module.exports = {
  name: 'reset-classes',
  description: 'Reset all class roles and clear chat history (Admin only)',
  async execute(message, isSlashCommand = false) {
    const interaction = isSlashCommand ? message : null;
    const member = isSlashCommand ? interaction.member : message.member;

    // Check if user has admin permissions
    if (!member.permissions.has('Administrator')) {
      const reply = { 
        content: 'You need Administrator permissions to use this command.',
        ephemeral: true
      };
      if (isSlashCommand) {
        return interaction.reply(reply);
      } else {
        const sentMessage = await message.reply(reply);
        setTimeout(() => sentMessage.delete(), 5000);
        return;
      }
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('reset-confirm-1')
          .setLabel('Yes')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('reset-cancel-1')
          .setLabel('No')
          .setStyle(ButtonStyle.Secondary)
      );

    const reply = {
      content: 'This will remove all users from the class channels, and reset the channel chats. Are you sure you want to do this?',
      components: [row],
      ephemeral: true
    };

    if (isSlashCommand) {
      return interaction.reply(reply);
    } else {
      const sentMessage = await message.reply(reply);
      setTimeout(() => sentMessage.delete(), 30000);
      return;
    }
  },

  async handleFirstConfirmation(interaction) {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('reset-confirm-2')
          .setLabel('Yes, I\'m sure!')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('reset-cancel-2')
          .setLabel('No, cancel!')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({
      content: 'Are you double sure??',
      components: [row],
      ephemeral: true
    });
  },

  async handleFinalConfirmation(interaction) {
    await interaction.update({
      content: 'Processing reset...',
      components: [],
      ephemeral: true
    });

    try {
      const guild = interaction.guild;
      let processedMembers = 0;
      let failedMembers = 0;

      // Get all members and process them with Promise.all
      const members = await guild.members.fetch();
      await Promise.all(Array.from(members.values()).map(async (member) => {
        try {
          const classRoles = member.roles.cache.filter(role => 
            selectableClasses.valid.includes(role.name.toLowerCase())
          );
          
          if (classRoles.size > 0) {
            await member.roles.remove(classRoles);
            processedMembers++;
          }
        } catch (memberError) {
          console.error(`Failed to process member ${member.user.tag}:`, memberError);
          failedMembers++;
        }
      }));

      // Clear messages from all class channels
      for (const className of selectableClasses.valid) {
        const channel = guild.channels.cache.find(
          ch => ch.name.toLowerCase() === className.toLowerCase()
        );
        
        if (channel) {
          try {
            const messages = await channel.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
              await channel.bulkDelete(messages, true);
            }
          } catch (channelError) {
            console.error(`Failed to clear channel ${className}:`, channelError);
          }
        }
      }

      let statusMessage = 'Reset completed! ';
      if (processedMembers > 0) {
        statusMessage += `Removed roles from ${processedMembers} members. `;
      }
      if (failedMembers > 0) {
        statusMessage += `\nFailed to process ${failedMembers} members (see console for details). `;
      }
      statusMessage += '\nChannels have been cleared where possible.';

      await interaction.editReply({
        content: statusMessage,
        components: [],
        ephemeral: true
      });

    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: 'An error occurred while resetting classes. Some operations may have completed partially.',
        components: [],
        ephemeral: true
      });
    }
  },

  async handleCancel(interaction) {
    await interaction.update({
      content: 'Reset cancelled.',
      components: []
    });
  }
};
