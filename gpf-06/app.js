const axios = require('axios');
const AWS = require('aws-sdk'),
    dynamoDb = new AWS.DynamoDB.DocumentClient(),
    TABLE_NAME = process.env.TABLE_NAME

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    
    
    let params = {
        TableName: TABLE_NAME
    }
    let experiments = await dynamoDb.scan(params)
    .promise()
    .then(response => {
        let experiments = response.Items
        return experiments;
    })
    
    let key = event.message.blocks[0].text.text.split('_')[1];
    
    const upvotedExperiment = await dynamoDb.update({
      TableName: TABLE_NAME,
      Key: {
        experimentsId: key
      },
      UpdateExpression: 'add #test :value',
      ExpressionAttributeNames: {
        '#test': 'upvotes',
      },
      ExpressionAttributeValues: {
        ':value': -1,
      },
      ReturnConsumedCapacity: 'TOTAL',
      ReturnValues: 'ALL_NEW',
    }).promise()
    
    let randomExperiment = experiments[Math.floor(Math.random() * experiments.length)];
    
    let blocks = [
  		{
  			"type": "section",
  			"text": {
  				"type": "mrkdwn",
  				"text": `_${randomExperiment.experimentsId}_\n\n*Should we test ${randomExperiment.text}?*`
  			}
  		},
  		{
  			"type": "actions",
  			"elements": [
  				{
  					"type": "button",
  					"text": {
  						"type": "plain_text",
  						"emoji": true,
  						"text": "Downvote"
  					},
  					"style": "danger",
  					"value": "downvote"
  				},
  				{
  					"type": "button",
  					"text": {
  						"type": "plain_text",
  						"emoji": true,
  						"text": "Skip"
  					},
  					"value": "skip"
  				},
  				{
  					"type": "button",
  					"text": {
  						"type": "plain_text",
  						"emoji": true,
  						"text": "Cancel"
  					},
  					"value": "cancel"
  				},
  				{
  					"type": "button",
  					"text": {
  						"type": "plain_text",
  						"emoji": true,
  						"text": "Upvote"
  					},
  					"style": "primary",
  					"value": "upvote"
  				}
  			]
  		}
  	]
    
    let body = {
        "response_type": "in_channel",
        "replace_original": true,
        "text": 'User test downvoted.',
        "blocks": blocks
      };
    
    return await axios.post(event.response_url, body).then(response => response.status);
    
};
