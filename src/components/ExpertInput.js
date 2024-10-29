import React, { useState, useEffect, ActivityIndicator, Alert } from 'react';
import { Upload, Button, message, Image, Typography, Input, Row, Col, Radio, 
  InputNumber, Select, Space, Tooltip, Spin, Segmented, Flex
} from 'antd';
import { InboxOutlined, PlusCircleOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import axios from 'axios';
import { CircularProgress } from '@mui/material';
import { LoadingOutlined, UploadOutlined } from '@ant-design/icons';
const { Text, Title } = Typography;

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const { Dragger } = Upload;
const { TextArea } = Input;

const sexOptions = [
  {
    label: 'Male',
    value: 'M',
  },
  {
    label: 'Female',
    value: 'F',
  },
  {
    label: 'NA',
    value: 'N',
  },
];

const extractFilenameComponents = (filename) => {
  const pattern = /^(\d+)_([MFN])_([^.]+)\.\w+$/;
  const match = filename.match(pattern);
  
  if (match) {
    const [, age, sex, diagnosis] = match;
    return {
      age: parseInt(age),
      sex,
      diagnosis
    };
  } else {
    return {diagnosis: filename};
  }
}

const ExpertInput = () => {
  const [imageDescription, setImageDescription] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState();
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [description, setDescription] = useState();
  const [questions, setQuestions] = useState([]);
  const [age, setAge] = useState();
  const [sex, setSex] = useState();
  const [diagnosis, setDiagnosis] = useState();
  const [imageBank, setImageBank] = useState('Neon');
  const [fetchedImageDetails, setFetchedImageDetails] = useState();
  const [countMessage, setCountMessage] = useState('');


  useEffect(() => {
    console.log(questions)
  }, [questions])
  const onSexChange = ({ target: { value } }) => {
    setSex(value);
  };

  const onDiagnosisChange = ({ target: { value } }) => {
    setDiagnosis(value);
  };

  const BASE_URL = "https://dermflowai.azurewebsites.net"
  // const BASE_URL = "http://localhost:8000"

  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const handleUpload = async () => {
    if(!description || description.trim() === '') {
      message.error('Please enter some description');
      return;
    }
    const formData = new FormData();
    // fileList.forEach((file) => {
    //   formData.append('files[]', file);
    // });
    formData.append('file', fileList[0]);
    formData.append('description', description)
    formData.append('age', age)
    formData.append('sex', sex)
    formData.append('diagnosis', diagnosis)
    // const questions = [{type: 'standard', question: 'When did you first start noticing this? '},
    // {type: 'diagnosis', question: 'Did you start any medication? '}
    // ]
    formData.append('questions', JSON.stringify(questions.filter(({deleted}) => !deleted)))
    formData.append('image_bank', JSON.stringify(fetchedImageDetails))
    setUploading(true);
    // You can use any AJAX library you like
    // ?description=${description}&age=${age}&sex=${sex}&diagnosis=${diagnosis}
    // fetch(BASE_URL+`/expert/image`, {
    //   method: 'POST',
    //   body: formData,
      
    // })
      const response = await axios.post(BASE_URL+`/expert/image`, formData, {
        headers: {
        'Content-Type': 'multipart/form-data'
        }
      })
      if(response.data && response.data.success) {
        setFileList([]);
        setPreviewImage();
        setDescription();
        setAge();
        setSex();
        setDiagnosis();
        setQuestions([])
        message.success(response.data.message);
        message.success(countMessage);
        setCountMessage('');
      } else {
        message.error(response.data.message);
      }
      setUploading(false);
  };

  const uploadButton = () => {
    return <Button
    type="primary"
    onClick={handleUpload}
    disabled={fileList.length === 0 || questions.length === 0 || !(sex && age && diagnosis && description && questions.filter(({question, deleted, saved}) => !deleted && (!question || !saved) ).length === 0)}
    loading={uploading}
    style={{
      // marginTop: 16,
      marginLeft: 16
    }}
  >
    {uploading ? 'Uploading' : 'Submit'}
  </Button>
  };

  const handleFetchPreview = async (imageContent, imageName) => {
    const metadata = extractFilenameComponents(imageName);
    if(metadata) {
      const {age, sex, diagnosis} = metadata;
      setAge(age);
      setSex(sex);
      setDiagnosis(diagnosis)
    }
    setDescription();
    setQuestions([])
    if (!imageContent.url && !imageContent.preview) {
      const preview = await getBase64(imageContent);
      setPreviewImage(preview);    
    }
  }

  const handlePreview = async (file) => {
    const metadata = extractFilenameComponents(file.name);
    if(metadata) {
      const {age, sex, diagnosis} = metadata;
      setAge(age);
      setSex(sex);
      setDiagnosis(diagnosis)
    }
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file);
    }
    setPreviewImage(file.url || file.preview);
    // setPreviewOpen(true);
  };

  const props = {
    onPreview: handlePreview,
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
      setPreviewImage()
    },
    beforeUpload: (file) => {
      handlePreview(file)
      setFileList([file]);
      return false;
    },
    fileList,
  };

  const handleChange = ({ fileList: newFileList }) => setFileList(newFileList);

  const onQuestionUpdate = (questionObj) => {
    const { id, type, question, deleted, saved } = questionObj;
    const questionsCopy = questions.slice(0);
    questionsCopy[id] = {type, question, deleted, saved}
    setQuestions(questionsCopy)
  }

  const handleFetchImage = async () => {
    setUploading(true);
    try {
      const response = await axios.post(BASE_URL+`/random-image`, {name: imageBank}, {
          responseType: 'blob',
          headers: {
              'Accept': 'image/jpeg'
          }
        })
          const file = response.data
          const fileName = response.headers['x-blob-name'];
          const done = response.headers['x-blobs-done'];
          const total = response.headers['x-blobs-total'];
          console.log(done, total)
          try{
            const doneUpdated = parseInt(done) + 1;
            setCountMessage(`${doneUpdated}/${total} images submitted!!`)
          } catch(error) {
            console.log('error', error)
          }
          setFetchedImageDetails({
            name: imageBank,
            blobname: fileName 
          })
          handleFetchPreview(file, fileName);
          setFileList([file]);
        }
    catch(error) {
        const errorMessage = await error.response.data.text()
        const errorObj = JSON.parse(errorMessage)
        message.error(errorObj.detail);
        // if (error.response) {
        //   // The request was made and the server responded with a status code
        //   // that falls out of the range of 2xx
        //   console.error('Error:', error.response.data);
        // } else {
        //   // Something happened in setting up the request that triggered an Error
        //   console.error('Error:', error.message);
        // }
      };

    // if(response.data) {
    //   if(response.data.message && response.data.success === false) {
    //     message.error(response.data.message);
    //   } else {
    //   }
    //   // message.success(response.data.message);
    // } else {
    //   message.error('Fetching Image failed');
    // }
    setUploading(false);
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title> Expert Input </Title>
      <Flex gap="small" align="flex-start" >
      <Segmented
        default={'Neon'}
        options={['Neon', 'Violet', {label: 'Disco', value: 'Disco', disabled: true}]}
        onChange={(value) => {
          setImageBank(value)
          console.log(value); // string
        }}
      />      
      <Button type="primary" disabled={uploading} onClick={handleFetchImage}>
        {uploading? <Spin /> : 'Fetch New Image'}
      </Button>
    </Flex>

      <Row gutter={[16, 16]}>
        <Col span={previewImage ? 12 : 24}>
          <Dragger {...props} >
            {!previewImage && <p className="ant-upload-drag-icon">
            <InboxOutlined />
            </p> }
            {!previewImage && <p className="ant-upload-text">Click or drag file to this area to upload</p> }
            {
            !previewImage && <p className="ant-upload-hint">
            Support for a single or bulk upload. Strictly prohibited from uploading company data or other
            banned files.
            </p>
            }
            {
            previewImage && <p className="ant-upload-hint">
            Please describe the image and upload. Drag a new image or click here to replace the image.
            </p> 
            }
          </Dragger>
        </Col>
        {previewImage && (
          <Col span={12}>
            <Image
              preview={{
                visible: previewOpen,
                onVisibleChange: (visible) => setPreviewOpen(visible),
                // afterOpenChange: (visible) => !visible && setPreviewImage(''),
              }}
              src={previewImage}
              alt="Uploaded image"
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
          </Col>
        )}
      </Row>
      {
        previewImage && (
          <Row justify="center" style={{ marginTop: '50px' }}>
          {/* <Col span={24}> */}
            {/* <div style={{ textAlign: 'center', marginBottom: '10px' }}> */}
            <Col span={4}>
            <InputNumber 
            addonBefore={<Text strong>Age</Text>} 
            value={age} 
            onChange={setAge}
            min={0}
            max={150}
            />
            </Col>
            <Col style={{ marginLeft: '10px' }}>
            <Radio.Group
        options={sexOptions}
        onChange={onSexChange}
        value={sex}
        optionType="button"
        buttonStyle="solid"
      />
      </Col>
      <Col style={{ marginLeft: '10px' }}>
      <TextArea
      status={!diagnosis && "error"} 
      placeholder="Diagnosis" 
      value={diagnosis}
      onChange={onDiagnosisChange} 
      allowClear
      autoSize />
      </Col>
      <Col>
            {uploadButton()}  
            </Col>
            </Row>
        )
      }
      {previewImage && (
            <Row style={{ marginTop: '10px' }}> 
            <TextArea
            type="text"
            status={!description && "error"} 
            disabled={uploading}
            placeholder="Enter your description here..."
            onChange={(e) => {
            setDescription(e.target.value)
            }}
            value={description}
            allowClear
            />
            </Row>)
}
{
  previewImage && <h1> Please add some questions</h1>
}
{previewImage && questions.length > 0 && questions.map(({type, question, deleted}, index) => {
                if(deleted) return;
                return  <QuestionInput key={index} type={type} question={question} id={index} onValueChange={onQuestionUpdate}/>
              } )
}
{previewImage && <Row>
            <Button style={{marginTop: '10px'}} 
            onClick={() => {
              console.log(questions)
              setQuestions((prevState) => ([...prevState, {type: "standard", question: ''}]))
            }}
            type="primary"> Add a question</Button>
          </Row>
      }
    </div>
  );
};

const QuestionInput = ({id, type, question, onValueChange}) => {

  const [ltype, setLtype] = useState(type);
  const [lquestion, setLquestion] = useState(question);
  const [qChange, setQChange] = useState(false);
  const [addInProgress, setAddInProgress] = useState(false);
  const [delInProgress, setDelInProgress] = useState(false);
  const [resetInProgress, setResetInProgress] = useState(false);

  const options = [
    {value: "standard", label: 'Standard'},
    {value: "diagnosis", label: 'Suspected Diagnosis'},
    {value: "uncertainty", label: 'Diagnostic Uncertainty'},
    {value: "management", label: 'Management'}
  ]
  const selectBefore = (
    <Select options={options} defaultValue={ltype} onChange={(value) => {
      setLtype(value)
    }} />
  );

  useEffect(() => {
    setQChange(true);
    console.log('--->', lquestion)
    onValueChange({id, type: ltype, question: lquestion, saved: false}) 
  }, [lquestion])

  const onReset = (e) => {
    e.preventDefault();
    setResetInProgress(true);
    setLquestion(question) 
    setTimeout(() => {
      setResetInProgress(false);
      setQChange(false)
    }, 1000)
  }

  const onAdd = (e) => {
    e.preventDefault();
    setAddInProgress(true);
    console.log('xxxx', lquestion)
    onValueChange({id, type: ltype, question: lquestion, saved: true})
    setTimeout(() => {
      setAddInProgress(false);
      setQChange(false)
    }, 1000)
  }

  const onDelete = (e) => {
    e.preventDefault();
    setDelInProgress(true);
    onValueChange({id, type: ltype, question: lquestion, deleted: true})
    setTimeout(() => {
      setDelInProgress(false);
    }, 1000)
  }

  return (<Row style={{marginTop: '5px'}}>
    <Col span={qChange ? 21: 23}><Input value={lquestion} status={!question && "error"} addonBefore={selectBefore} defaultValue={lquestion} onChange={({ target: { value } }) => {
      console.log('adasfsf', value)
      setLquestion(value)
    }}/></Col> 
    {qChange && <Col span={1}><Tooltip title="Reset">
    <Button onClick={onReset} type="default" shape="circle" icon={resetInProgress? <Spin size="small" /> : <SyncOutlined />} />
    </Tooltip> </Col> }
    {qChange && <Col span={1}><Tooltip title="Add">
    <Button onClick={onAdd} type="default" shape="circle" icon={addInProgress? <Spin size="small" /> : <PlusCircleOutlined />} />
    </Tooltip> </Col> }
    <Col span={1}> <Tooltip title="Delete"><Button onClick={onDelete} type="default" shape="circle" icon={delInProgress? <Spin size="small" /> : <DeleteOutlined /> } />
  </Tooltip>
  </Col>
    {/* <Col></Col>  */}
</Row>)
}


export default ExpertInput; 