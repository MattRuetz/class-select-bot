const { Client, IntentsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const client = new Client({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'select-class') {
    // Get all text channels except 'general'
    const availableChannels = interaction.guild.channels.cache
      .filter(channel => 
        channel.type === 2 && // 2 represents text channels
        channel.name.toLowerCase() !== 'general'
      )
      .map(channel => ({
        label: channel.name,
        value: channel.name.toLowerCase()
      }));

    if (availableChannels.length === 0) {
      return await interaction.reply({
        content: 'No available classes found!',
        ephemeral: true
      });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('class-select')
          .setPlaceholder('Select your class')
          .addOptions(availableChannels)
      );

    await interaction.reply({ content: 'Please select your class:', components: [row] });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === 'class-select') {
    try {
      const selectedClass = interaction.values[0];
      // First try to find the role
      const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === selectedClass.toLowerCase());
      
      if (!role) {
        return await interaction.reply({ 
          content: `Error: Role for ${selectedClass} not found. Please contact an administrator.`,
          ephemeral: true 
        });
      }

      await interaction.member.roles.add(role);
      
      // Find or create the corresponding channel
      let channel = interaction.guild.channels.cache.find(
        c => c.name.toLowerCase() === selectedClass.toLowerCase()
      );
      
      if (!channel) {
        channel = await interaction.guild.channels.create({
          name: selectedClass,
          type: 2, // 2 represents text channels
          permissionOverwrites: [
            {
              id: interaction.guild.id, // @everyone role
              deny: ['ViewChannel'],
            },
            {
              id: role.id,
              allow: ['ViewChannel'],
            }
          ]
        });
      }

      await interaction.reply({ 
        content: `You have been added to the ${selectedClass} class and channel!`,
        ephemeral: true 
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: 'Sorry, there was an error processing your request.',
        ephemeral: true 
      });
    }
  }
});

client.login(process.env.TOKEN);