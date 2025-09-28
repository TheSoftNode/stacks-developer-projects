const https = require('https');
const fs = require('fs');

// Your wallet addresses from the file
const wallets = [
  {
    email: 'j.atueyi@yahoo.com',
    address: 'SP3Y2767DSNTBTP7Q86GRQ4NBG69C6SD1AKTWFZZP',
  },
  {
    email: 'franciscaatueyi8@gmail.com',
    address: 'SP2YB7WP8BQCWR07AGEEK3Y2MTZBV8C9FVVC3T2WJ',
  },
  {
    email: 'jatueyi10@gmail.com',
    address: 'SP3649CTYPZ3VFW7H3K685Y6N7FF4D1JGD1WEE0GW',
  },
  {
    email: 'atueyi.j@yahoo.com',
    address: 'SP3EJETY7KDE1AETK6GDWM9V1N7K87WRTVAJAHFXY',
  },
  {
    email: 'jatueyiodigie@yahoo.com',
    address: 'SP1HR1JS5X3XPX0N2PCH6NG2BK4EAR71N0SHMSMES',
  },
  {
    email: 'jeyrio45@gmail.com',
    address: 'SP125QH6MAP1FQ7EABD4Z8NQFHVNRQ6F34R3YVR8',
  },
  {
    email: 'jennydev047@gmail.com',
    address: 'SP20YTDCAWH2QPT8MH02J67EKVC5A0AT7B3NETGNV',
  },
  {
    email: 'Jeydev61@gmail.com',
    address: 'SP2ZZS121JQVCXJ3XKNJX4J8F5Y6YXXYRRKE7CQNA',
  },
  {
    email: 'devcode964@gmail.com',
    address: 'SP2ZH0K05N526NFP73396AQP8EXWTDEK5RANCG1S9',
  },
  {
    email: 'jeycoder1@gmail.com',
    address: 'SP2A7MJGFWE78Q1GN21GV18E42BK0AEHJ08J9BR4H',
  },
  {
    email: 'devjey22@gmail.com',
    address: 'SPR6DK9TSKQ2JSK02XR3A45ZC2TJCJS9A8K2DYF0',
  },
  {
    email: 'jeyatueyi@gmail.com',
    address: 'SP208GB00QCX10ANJN2BA8X6SD582DZ8EJSRYWEV4',
  },
  {
    email: 'chiomaatueyi08@gmail.com',
    address: 'SP336EMXTKDQ4KSJ1H1NSXMSRYQKRJ7VRR2J476ET',
  },
  {
    email: 'jenniferatueyiodigie@gmail.com',
    address: 'SP5YP72W79V0C7E3KV7ZQT3TVA9ZWXEAWJ2HP0S0',
  },
  {
    email: 'jeyatueyiodigie@gmail.com',
    address: 'SP3ZNM90JEP3RRV115TTAV4BKAWC89C35J84DY8P7',
  },
  {
    email: 'alexanderatueyi7@gmail.com',
    address: 'SP3AMRGAVPY36DXA7526FJAV5MPF008XMKD8KX3HV',
  },
  {
    email: 'atueyiodigiefrancisca@gmail.com',
    address: 'SP20FY9XFDG738JPGJRW02079D2Y2CVEMWA40YCDX',
  },
  {
    email: 'frankatueyi73@gmail.com',
    address: 'SP3CW36769PG17NCBKM2NDE1PM1QYZPBJ1Q7SEGRH',
  },
  {
    email: 'vanessaatueyi68@gmail.com',
    address: 'SP2PNZBMK3XQZH8GXE71JCRVDH5FEP1RN4CXNHTDJ',
  },
  {
    email: 'atueyiijeoma156@gmail.com',
    address: 'SP3T6K8N3MK98D3XSG5QA92VDNKMY682HZA234KEN',
  },
  {
    email: 'charlesatueyi8@gmail.com',
    address: 'SP1R8639NQ7NHE693PC1W6GPTT16YJ60E1WH4SPH1',
  },
  {
    email: 'atueyiakachukwu5@gmail.com',
    address: 'SP1MZ7PFEVNJ54Q5Q1G5FXWKX4RGJM4N14QT5H4GT',
  },
  {
    email: 'catueyi065@gmail.com',
    address: 'SP2F4CP9RNATE7BZ7KYE2VWCP705X5C5S3WC6A23N',
  },
  {
    email: 'atueyifaith19@gmail.com',
    address: 'SP3HRZP23H927CSR8W469XM0BEF8JE0GGASY8JZWX',
  },
  {
    email: 'atueyialexander8@gmail.com',
    address: 'SP1TY95R0CYK81Y42B2ZP1CHXBMZBAFBD68HAFRY0',
  },
  {
    email: 'cherishbeckley@gmail.com',
    address: 'SP28KGYEH2WQAYZAT6WRDWHJA4K4S353A8DQZDH8E',
  },
  {
    email: 'devchioma5@gmail.com',
    address: 'SPWQN3X6DS0B6K9X6AW1YHNDY06TRYSWGA5Z8A0',
  },
  {
    email: 'beatricemoses233@gmail.com',
    address: 'SP22XQ4NYZK3GCYK2T1T66W5142Y3Q5Y8QV8F51HX',
  },
  {
    email: 'ezekielblossom202@gmail.com',
    address: 'SP228QSP9STV1PSVCVHF24JV076J2C0GSMDMD5G7E',
  },
  {
    email: 'charlesatueyi0@gmail.com',
    address: 'SP1RMWEQ674TTXA7XA888W7GE58YZVPXA81RK0X5V',
  },
  {
    email: 'omatsolavictor13@gmail.com',
    address: 'SPRVTKATWDVF06ZQBM20J9D3EKHBFWT5QFN8ZCWY',
  },
];

// Function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Function to get STX balance for a specific address
async function getSTXBalance(address) {
  try {
    const url = `https://api.hiro.so/extended/v1/address/${address}/balances`;
    const response = await makeRequest(url);

    // Convert microSTX to STX (1 STX = 1,000,000 microSTX)
    const stxBalance =
      parseInt(response.stx.balance) / 1000000;
    const lockedBalance =
      parseInt(response.stx.locked) / 1000000;

    return {
      available: stxBalance,
      locked: lockedBalance,
      total: stxBalance + lockedBalance,
    };
  } catch (error) {
    console.error(
      `Error fetching balance for ${address}:`,
      error.message
    );
    return null;
  }
}

// Function to check all wallet balances
async function checkAllBalances() {
  console.log('🚀 Starting STX Wallet Balance Check...\n');
  console.log('='.repeat(80));

  let totalBalance = 0;
  let totalLocked = 0;
  let successCount = 0;

  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    console.log(`\n📧 Email: ${wallet.email}`);
    console.log(`📍 Address: ${wallet.address}`);

    const balance = await getSTXBalance(wallet.address);

    if (balance) {
      console.log(
        `💰 Available: ${balance.available.toFixed(6)} STX`
      );
      console.log(
        `🔒 Locked: ${balance.locked.toFixed(6)} STX`
      );
      console.log(
        `📊 Total: ${balance.total.toFixed(6)} STX`
      );

      totalBalance += balance.available;
      totalLocked += balance.locked;
      successCount++;
    } else {
      console.log('❌ Failed to fetch balance');
    }

    console.log('-'.repeat(60));

    // Add small delay to avoid rate limiting
    if (i < wallets.length - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 SUMMARY');
  console.log('='.repeat(80));
  console.log(
    `✅ Successfully checked: ${successCount}/${wallets.length} wallets`
  );
  console.log(
    `💰 Total Available Balance: ${totalBalance.toFixed(
      6
    )} STX`
  );
  console.log(
    `🔒 Total Locked Balance: ${totalLocked.toFixed(6)} STX`
  );
  console.log(
    `📊 Grand Total: ${(totalBalance + totalLocked).toFixed(
      6
    )} STX`
  );

  // Save results to file
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      walletsChecked: successCount,
      totalWallets: wallets.length,
      totalAvailable: totalBalance,
      totalLocked: totalLocked,
      grandTotal: totalBalance + totalLocked,
    },
    wallets: [],
  };

  // Re-check and save individual results
  for (const wallet of wallets) {
    const balance = await getSTXBalance(wallet.address);
    results.wallets.push({
      email: wallet.email,
      address: wallet.address,
      balance: balance,
    });
    await new Promise((resolve) =>
      setTimeout(resolve, 300)
    );
  }

  fs.writeFileSync(
    'stx-balance-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log(
    '\n💾 Results saved to stx-balance-results.json'
  );
}

// Function to check a single wallet
async function checkSingleWallet(address) {
  console.log(`🔍 Checking balance for: ${address}\n`);

  const balance = await getSTXBalance(address);

  if (balance) {
    console.log(
      `💰 Available: ${balance.available.toFixed(6)} STX`
    );
    console.log(
      `🔒 Locked: ${balance.locked.toFixed(6)} STX`
    );
    console.log(
      `📊 Total: ${balance.total.toFixed(6)} STX`
    );
  } else {
    console.log('❌ Failed to fetch balance');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Check specific wallet address
    const address = args[0];
    await checkSingleWallet(address);
  } else {
    // Check all wallets
    await checkAllBalances();
  }
}

// Run the script
main().catch(console.error);