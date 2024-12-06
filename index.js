const fs = require('fs');
const path = require('path');

const scriptToInsert =
    `    /* * * * * * * * * * ismobil-to-window * * * * * * * * * */
    <script>
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUserAgent = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isLimitedHardware = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        const isMobileDevice = isTouchDevice || isMobileUserAgent || isLimitedHardware;
        window.isMobile = isMobileDevice;
    </script>
    /* * * * * * * * * * ismobil-to-window * * * * * * * * * */
</head>`;


//directorios a excluir
const excludeDirs = [
    'node_modules',
    'dist',
    'build',
    'assets',
    'cordova',
    'public',
    'www'
];

const processedFiles = [];

function shouldExcludeDir(dir) {
    return excludeDirs.includes(dir) || dir.startsWith('.');
}

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    console.log(`Consultando directorio: ${directory}`);
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            if (!shouldExcludeDir(file)) {
                processDirectory(filePath);
            }
        } else if (stats.isFile() && file === 'index.html') {
            processFile(filePath);
        }
    });
}


function processFile(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return console.error(`Error leyendo el archivo ${filePath}:`, err);
 
        }
        if (data.includes('</head>')) {
            const result = data.replace('</head>', scriptToInsert);
            if (result !== data) {
                fs.writeFile(filePath, result, 'utf8', err => {
                    if (err) {
                        console.error(`Error escribiendo el archivo ${filePath}:`, err);
                    } else {
                        console.log(`Archivo procesado: ${filePath}`);
                        processedFiles.push(path.relative(process.cwd(), filePath));
                    }
                });
            }
        }
    });
}

const startDirectory = path.join(__dirname , '..', '..');
processDirectory(startDirectory);

process.on('exit', () => {
    if (processedFiles.length > 0) {
        console.log('\nArchivos modificados:');
        processedFiles.forEach(file => console.log(file));
    } else {
        console.log('\nNo se modificaron archivos.');
    }
});