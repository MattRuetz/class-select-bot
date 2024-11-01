module.exports = {
  name: 'help',
  description: 'Show available commands',
  async execute(message, isSlashCommand = false) {
    const interaction = isSlashCommand ? message : null;
    const member = isSlashCommand ? interaction.member : message.member;
    const isAdmin = member.permissions.has('Administrator');
    
    let helpMessage = '**Available UsherBot Commands:**\n\n' +
      '`/select-classes` - Select classes to join\n' +
      '`/help` or `.usherbot` or `.usherbot-help` - Show this help message\n';
    
    if (isAdmin) {
      helpMessage += '\n**Admin Commands:**\n' +
        '`/set-selectable-classes` - Configure which classes are available for selection\n' +
        '`/reset-classes` - Reset all class roles and clear chat history\n';
    }
    
    const reply = {
      content: helpMessage,
      ephemeral: true
    };

    return isSlashCommand ? interaction.reply(reply) : message.reply(reply);
  }
};
