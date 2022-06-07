import fetch from 'node-fetch';

const explorePosts = `
query($request: ExplorePublicationRequest!) {
  explorePublications(request: $request) {
    items {
      __typename 
      ... on Post {
        ...PostFields
      }
      ... on Comment {
        ...CommentFields
      }
      ... on Mirror {
        ...MirrorFields
      }
    }
    pageInfo {
      prev
      next
      totalCount
    }
  }
}

fragment PostFields on Post {
  id
  createdAt
  appId
}

fragment MirrorBaseFields on Mirror {
  id
  createdAt
  appId
}

fragment MirrorFields on Mirror {
  ...MirrorBaseFields
  mirrorOf {
   ... on Post {
      ...PostFields          
   }
   ... on Comment {
      ...CommentFields          
   }
  }
}

fragment CommentBaseFields on Comment {
  id
  createdAt
  appId
}

fragment CommentFields on Comment {
  ...CommentBaseFields
  mainPost {
    ... on Post {
      ...PostFields
    }
    ... on Mirror {
      ...MirrorBaseFields
      mirrorOf {
        ... on Post {
           ...PostFields          
        }
        ... on Comment {
           ...CommentMirrorOfFields        
        }
      }
    }
  }
}

fragment CommentMirrorOfFields on Comment {
  ...CommentBaseFields
  mainPost {
    ... on Post {
      ...PostFields
    }
    ... on Mirror {
       ...MirrorBaseFields
    }
  }
}`;


export const fetchData = async () => {
  let count = {};
  let cursor = "0";
  let totalCount = 1;

  async function fetchPosts(cursor) {
    const response = await fetch('https://api.lens.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: explorePosts,
        variables: {
          request: {
            "sortCriteria": "LATEST",
            "publicationTypes": ["POST", "COMMENT", "MIRROR"],
            "limit": 50,
            "noRandomize": true,
            cursor: cursor
          },
        },
      }),
    })
    .then(response => response.json())
    .then(data => {
      const parsed = data.data.explorePublications.items;
      for (const item of parsed) {
        if (count[item.appId]) {
          count[item.appId] = count[item.appId] + 1;
        } else {
          count[item.appId] = 1;
        }
        count;
      }
      
      console.log("pageInfo", data.data.explorePublications.pageInfo);
      cursor = data.data.explorePublications.pageInfo.next;
      totalCount = data.data.explorePublications.pageInfo.totalCount;
    });
  
    return {
      cursor,
      totalCount
    };
  }

  while (totalCount > 0) {
    console.log("cursor before", cursor, totalCount);
    let results = await fetchPosts(cursor);
    console.log("cursor after", results.cursor, results.totalCount);
    cursor = results.cursor;
    totalCount = results.totalCount;
  }
  
};

// count {
// Lenster: 17277,
// phaver: 2419,
// 'Lenster Crowdfund': 527,
// 'Lenster Community': 796,
// refract: 169,
// iris: 198,
// 'lenstube-videos': 4,
// madseed: 5
// }
