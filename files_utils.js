const fs = require('fs');

module.exports={
    appendToFile:function appendToFile(filePath,text,cb){
        fs.appendFile(filePath, text, (err) => {
            if (err) {
                console.error('Error appending to the file:', err);
            } else {
                // console.log('Data appended to the file successfully.');
            }
        });
    },
    Logger:function(context,message){
        console.log(context+"\t:",message);
    }
}
