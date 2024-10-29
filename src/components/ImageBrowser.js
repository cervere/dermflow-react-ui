import React, { useState, useEffect } from 'react';
import { Breadcrumb, Layout, Menu, theme, Button, Image } from 'antd';
const { Header, Content, Footer } = Layout;

const items = new Array(15).fill(null).map((_, index) => ({
  key: index + 1,
  label: `nav ${index + 1}`,
}));

const ImageBrowser = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [items, setItems] = useState();
  const [activeItem, setActiveItem] = useState();
  const [activeSubdir, setActiveSubdir] = useState();
  const [folderCount, setFolderCount] = useState();
  const [totalFileCount, setTotalFileCount] = useState();
  const [subdirFileCount, setSubdirFileCount] = useState();
  const [currentImages, setCurrentImages] = useState([]);

  useEffect(() => {

    const updateImages = async () => {
        if(activeSubdir) {
            const images = await getImagesFromDirectory(activeSubdir);
            setCurrentImages(images);
            setSubdirFileCount(images.length)
        }
    }
    updateImages()
  }, [activeSubdir])

  async function getImageCountFromDirectory(dirHandle) {
    console.log(dirHandle)
    let imageCount = 0;
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        if (entry.name.match(/\.(jpeg|jpg|gif|png)$/i)) {
            imageCount += 1
        }
      } else if (entry.kind === 'directory') {
        const subDirImageCount = await getImageCountFromDirectory(entry);
        imageCount += subDirImageCount
      }
    }
    return imageCount;
  }

  async function getImagesFromDirectory(dirHandle) {
    console.log(dirHandle)
    const images = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        if (entry.name.match(/\.(jpeg|jpg|gif|png)$/i)) {
          const file = await entry.getFile();
          images.push({
            name: entry.name,
            url: URL.createObjectURL(file)
          });
        }
      } else if (entry.kind === 'directory') {
        const subDirImages = await getImagesFromDirectory(entry);
        images.push(...subDirImages);
      }
    }
    return images;
  }

  async function selectDirectory() {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const dirNames = [];
      let idx = 1
      let totalImageCount = 0 
      // Now you can use dirHandle to access the contents of the selected directory
      for await (const entry of dirHandle.values()) {
        if(entry.name === '.DS_Store') continue;
        dirNames.push({
                key: `${idx}`, 
                label: entry.name.split(' images')[0],
                dirEntry: entry 
        })
        idx += 1
        totalImageCount += await getImageCountFromDirectory(entry)
      }
      setItems(dirNames.sort((dirA, dirB) => dirA.label.localeCompare(dirB.label)))
      setFolderCount(idx - 1)
      setTotalFileCount(totalImageCount)
    } catch (err) {
      console.error('Error selecting directory:', err);
    }
  }

  const showBrowser = async () => {
    await selectDirectory();
  }

  return (
    <div>
    <Button style={{marginBottom: '10px'}} type="primary" onClick={showBrowser}>Select Folder</Button>
    {items && <h1> Folders : {folderCount}, Total Files : {totalFileCount} </h1>}
    <Layout>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          items={items}
          style={{
            flex: 1,
            minWidth: 0,
          }}
          onClick={(e) => {
            const selectedItem = items.find((item) => {
            return item.key === e.key
          })
          setActiveSubdir(selectedItem.dirEntry)
          }}
        />
      </Header>
      <Content
        style={{
          padding: '0 48px',
        }}
      >
        {activeSubdir && <Breadcrumb
          style={{
            margin: '16px 0',
          }}
        >
          <Breadcrumb.Item> <h1> {`${activeSubdir.name.split(' images')[0]}, ${subdirFileCount} images`}</h1></Breadcrumb.Item>
        </Breadcrumb>
        }
        <div
          style={{
            background: colorBgContainer,
            minHeight: 280,
            padding: 24,
            borderRadius: borderRadiusLG,
          }}
        >
          {
            currentImages &&   <Image.PreviewGroup
            preview={{
              onChange: (current, prev) => console.log(`current index: ${current}, prev index: ${prev}`),
            }}
          >
            {
             currentImages.map((image) => <Image width={200} src={image.url} />)   
            }
          </Image.PreviewGroup>
          }
        </div>
      </Content>
      <Footer
        style={{
          textAlign: 'center',
        }}
      >
        {/* DermFlow AI ©{new Date().getFullYear()} Created by cervere */}
      </Footer>
    </Layout>
    </div>
  );
};
export default ImageBrowser;