const CSVReader = require('./csvReader');
const QueryGenerator = require('./queryGenerator');

/**
 * Example usage of CSVReader
 */

const mapperMonth = {
  1: 'ene',
  2: 'feb',
  3: 'mar',
  4: 'abr',
  5: 'may',
  6: 'jun',
  7: 'jul',
  8: 'ago',
  9: 'sep',
  10: 'oct',
  11: 'nov',
  12: 'dic'
};

async function queryGenerator() {
  // Create a new CSV reader instance
  const reader = new CSVReader({
    delimiter: ';',
    encoding: 'utf-8',
    skipEmptyLines: true
  });
  const queryGenerator = new QueryGenerator();

  try {
    // Step 1: Read entire CSV to JSON array
    console.log('Step 1: Reading CSV to JSON array');
    console.log('=========================================');
    const data = await reader.readToJSON(`../${process.argv[2] || ((new Date().getDate()) + '-' + mapperMonth[new Date().getMonth() + 1])}.csv`);
    console.log('Data:', data);
    console.log('\n');
    // Step 2: Grouping by document_number (if needed)
    console.log('Step 2: Grouping by document_number');
    console.log('=========================================');
    const groupedData = [];
    data.forEach((row) => {
      const existing = groupedData.findIndex(r => r.document_number === row.document_number);
      if (existing === -1) {
        const merchants_id = [row.merchant_id];
        delete row.merchant_id;
        groupedData.push({...row, merchants_id});
      } else {
        groupedData[existing] = { ...groupedData[existing], merchants_id: [...groupedData[existing].merchants_id, row.merchant_id]};
      }
    });
    console.log('Grouped Data:', groupedData);
    // Step 3: Generate SQL query using QueryGenerator
    console.log('Step 3: Generating SQL query');
    console.log('=========================================');
    const sqlQueries = groupedData.map((row) => {
      const query = queryGenerator.getQuery(row);
      const fileName = process.argv[3] || 'C2ADGCS';
      require('fs').writeFileSync(`./output/${fileName}-${row.merchants_id.join('_')}-${row.document_type}.sql`, query + '\n');
    });
  } catch (error) {
    console.error('Error reading CSV:', error.message);
  }
}

// Run the example
if (require.main === module) {
  queryGenerator();
}

module.exports = queryGenerator;