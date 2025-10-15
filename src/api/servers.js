import request from './request';





export function fetchServerNodes() {

  return request({

    url: '/user/server/fetch',

    method: 'get'

  }).then(response => {

    if (typeof response === 'object') {

      return response;

    }

    

    throw new Error('Invalid response format');

  }).catch(error => {

    console.error('Error fetching server nodes:', error);

    throw error;

  });

}

// 获取分组信息
export function fetchGroupInfo() {
  return request({
    url: '/user/group/fetch', // 根据实际API调整
    method: 'get'
  }).then(response => {
    if (typeof response === 'object') {
      return response;
    }
    throw new Error('Invalid response format');
  }).catch(error => {
    console.error('Error fetching group info:', error);
    // 返回一个空的数据结构，让前端处理
    return {
      data: []
    };
  });
} 
