const fs = require('fs');
const readline = require('readline');

/**
 * CSV Reader with JSON format output
 * Reads a CSV file and converts it to JSON format
 */
class CSVReader {
  constructor(options = {}) {
    this.delimiter = options.delimiter || ',';
    this.encoding = options.encoding || 'utf-8';
    this.skipEmptyLines = options.skipEmptyLines !== false;
  }

  /**
   * Parse a CSV line respecting quoted fields
   * @param {string} line - CSV line to parse
   * @returns {Array} - Array of field values
   */
  parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === this.delimiter && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  }

  /**
   * Read CSV file and convert to JSON array
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<Array>} - Promise resolving to array of objects
   */
  async readToJSON(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      let headers = [];
      let isFirstLine = true;

      const fileStream = fs.createReadStream(filePath, { 
        encoding: this.encoding 
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        // Skip empty lines if configured
        if (this.skipEmptyLines && !line.trim()) {
          return;
        }

        const fields = this.parseLine(line);

        if (isFirstLine) {
          // First line contains headers
          headers = fields;
          isFirstLine = false;
        } else {
          // Create object from fields
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = fields[index] || '';
          });
          results.push(obj);
        }
      });

      rl.on('error', (error) => {
        reject(error);
      });

      rl.on('close', () => {
        resolve(results);
      });
    });
  }

  /**
   * Read CSV file and convert to JSON string
   * @param {string} filePath - Path to CSV file
   * @param {boolean} pretty - Whether to format JSON with indentation
   * @returns {Promise<string>} - Promise resolving to JSON string
   */
  async readToJSONString(filePath, pretty = false) {
    const data = await this.readToJSON(filePath);
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * Stream CSV file and process each row as JSON
   * @param {string} filePath - Path to CSV file
   * @param {Function} callback - Function called for each row (row, index)
   * @returns {Promise<void>}
   */
  async streamToJSON(filePath, callback) {
    return new Promise((resolve, reject) => {
      let headers = [];
      let isFirstLine = true;
      let rowIndex = 0;

      const fileStream = fs.createReadStream(filePath, { 
        encoding: this.encoding 
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        // Skip empty lines if configured
        if (this.skipEmptyLines && !line.trim()) {
          return;
        }

        const fields = this.parseLine(line);

        if (isFirstLine) {
          headers = fields;
          isFirstLine = false;
        } else {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = fields[index] || '';
          });
          callback(obj, rowIndex++);
        }
      });

      rl.on('error', (error) => {
        reject(error);
      });

      rl.on('close', () => {
        resolve();
      });
    });
  }
}

module.exports = CSVReader;
