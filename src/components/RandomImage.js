import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = "http://localhost:8000"

function RandomImage() {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
        const formData = new FormData();
        formData.append('name', 'Neon');
        const response = await axios.post(BASE_URL+`/random-image`, {name: 'neon'}, {
            responseType: 'blob',
            headers: {
                'Accept': 'image/jpeg'
            }
        })
        if(response.data) {
            const blob = response.data
            console.log('...', blob.filename) 
            const blobName = response.headers['X-Blob-Name'];
            console.log(response.headers.toJSON())
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
        }
    }

    fetchImage()
  }, []);

  return (
    <div>
      {imageUrl && <img src={imageUrl} alt="Random" />}
    </div>
  );
}

export default RandomImage;