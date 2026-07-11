
import axios from 'axios';
axios.get('http://localhost:3000/api/v1/accounting/seed')
  .then(res => console.log(res.data))
  .catch(err => {
    if (err.response) {
      console.log(err.response.data);
    } else {
      console.error(err.message);
    }
  });
