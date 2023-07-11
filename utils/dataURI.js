import DataUriParser from 'datauri/parser.js'
import path from 'path'


const getDataURI = async (file) => {

    const parser = new DataUriParser()
    const extName = path.extname(file.originalname).toString()

    // console.log('-------------------')
    // console.log(extName)
    // console.log(file)
    // console.log(file.originalname)
    // console.log('-------------------')

    return parser.format(extName, file.buffer)
}

export default getDataURI