const {
  SlashCommandBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("@discordjs/builders");
const profileModel = require("../models/profileSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Gamble with your coins")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("fourfold-fortune")
        .setDescription(" Can double, even, half or lose your coins")
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("amount of coins to gamble")
            .setMaxValue(200)
            .setMinValue(2)
            .setRequired(true)
        )
    ),

  async execute(interaction, profileData) {
    const { username, id } = interaction.user;
    const { balance } = profileData;

    const gambleCommand = interaction.options.getSubcommand();

    const gambleEmbed = new EmbedBuilder().setColor(0xfdd700);

    if (gambleCommand === "fourfold-fortune") {
      const amount = interaction.options.getInteger("amount");

      if (balance < amount) {
        await interaction.deferReply({ ephemeral: true });
        return await interaction.editReply(
          `You don't have ${amount} coins to gamble with :(`
        );
      }

      await interaction.deferReply();

      const Button1 = new ButtonBuilder()
        .setCustomId("one")
        .setLabel("Fortune 1")
        .setStyle(ButtonStyle.Primary);

      const Button2 = new ButtonBuilder()
        .setCustomId("two")
        .setLabel("Fortune 2")
        .setStyle(ButtonStyle.Primary);

      const Button3 = new ButtonBuilder()
        .setCustomId("three")
        .setLabel("Fortune 3")
        .setStyle(ButtonStyle.Primary);

      const Button4 = new ButtonBuilder()
        .setCustomId("four")
        .setLabel("Fortune 4")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(
        Button1,
        Button2,
        Button3,
        Button4
      );

      gambleEmbed
        .setTitle(`Playing FourFold Fortune for ${amount} coins`)
        .setFooter({
          text: "Each option has DOUBLE COINS, EVEN COINS, LOSE HALF or LOSE ALL",
        });

      await interaction.editReply({ embeds: [gambleEmbed], components: [row] });

      // apanhar a mensagem que enviamos
      const message = await interaction.fetchReply();

      const filter = (i) => i.user.id === interaction.user.id;

      const collector = message.createMessageComponentCollector({
        filter,
        time: 120000, //2 min para o utilizador clicar num botão
      });

      const double = "DOUBLE COINS";
      const half = "LOSE HALF";
      const lose = "LOSE ALL";
      const even = "EVEN COINS";

      const getAmount = (label, gamble) => {
        let amount = -gamble;
        if (label === double) {
          amount = gamble;
        } else if (label === half) {
          amount = -Math.round(gamble / 2);
        } else if (label === even) {
          amount = gamble;
        }
        return amount;
      };

      let choice = null;

      collector.on("collect", async (i) => {
        let options = [Button1, Button2, Button3, Button4];

        const randIdxDouble = Math.floor(Math.random() * 4);
        const doubleButton = options.splice(randIdxDouble, 1)[0];
        doubleButton.setLabel(double).setDisabled(true);

        const randIdxHalf = Math.floor(Math.random() * 3);
        const halfButton = options.splice(randIdxHalf, 1)[0];
        halfButton.setLabel(half).setDisabled(true);

        const randIdxEven = Math.floor(Math.random() * 2);
        const evenButton = options.splice(randIdxEven, 1)[0];
        evenButton.setLabel(even).setDisabled(true);

        const zeroButton = options[0];
        zeroButton.setLabel(lose).setDisabled(true);

        Button1.setStyle(ButtonStyle.Secondary);
        Button2.setStyle(ButtonStyle.Secondary);
        Button3.setStyle(ButtonStyle.Secondary);
        Button4.setStyle(ButtonStyle.Secondary);

        if (i.customId === "one") choice = Button1;
        else if (i.customId === "two") choice = Button2;
        else if (i.customId === "three") choice = Button3;
        else if (i.customId === "four") choice = Button4;

        choice.setStyle(ButtonStyle.Success);

        const label = choice.data.label;
        const amtChange = getAmount(label, amount);

        await profileModel.findOneAndUpdate(
          {
            userId: id,
          },
          {
            $inc: {
              balance: amtChange,
            },
          }
        );

        if (label === double) {
          gambleEmbed
            .setTitle("DOUBLED! You just doubled your coins!!")
            .setFooter({ text: `${username} gained ${amtChange} coins!` });
        } else if (label === half) {
          gambleEmbed
            .setTitle(
              "Well... It could be worse. You just lost half of your coins."
            )
            .setFooter({ text: `${username} lost ${amtChange} coins!` });
        } else if (label === lose) {
          gambleEmbed
            .setTitle("Oof... You just lost all your coins.")
            .setFooter({ text: `${username} lost ${amtChange} coins!` });
        } else if (label === even) {
          gambleEmbed
            .setTitle(
              "Nothing happens... You have kept the same amount of coins."
            )
            .setFooter({ text: `${username} kept his ${amtChange} coins!` });
        }

        await i.update({ embeds: [gambleEmbed], components: [row] });
        collector.stop();
      });
    }
  },
};
