const db = require('../models/database');
const {
  getRelationByLabelId,
  getRelationByMemoId,
  getMemoByMemoId,
  getLabelByLabelId,
} = require('../utils/relationUtil');
const httpStatus = require('http-status-codes');
const { createError, createResponse } = require('../utils/responseUtil');

module.exports = {
  addMemosToLabel: (req, res) => {
    const labelId = req.params.id;
    const { memoIds } = req.body;

    let label = getLabelByLabelId(labelId);

    if (!label) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send(createError('unable to find designated label'));
    }

    if (memoIds && memoIds.length > 0) {
      memoIds.forEach(memoId => {
        const relations = getRelationByMemoId(memoId);
        const exists = relations.find(relation => relation.labelId === labelId);
        if (!exists) {
          db.get('labelsToMemos')
            .push({ labelId, memoId })
            .write();
        }
      });
    }
    /**
     * 해당 Label에 memoCount 수정
     */
    db.get('labels')
      .find({ id: labelId })
      .assign({ memoCount: (getRelationByLabelId(labelId) || []).length })
      .write();

    label = getLabelByLabelId(labelId);

    return res.status(httpStatus.OK).send(createResponse(label));
  },
  deleteMemosFromLabel: (req, res) => {
    const labelId = req.params.id;
    const { memoIds } = req.body;

    let label = getLabelByLabelId(labelId);

    if (!label) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send(createError('unable to find designated label'));
    }

    if (memoIds && memoIds.length > 0) {
      memoIds.forEach(memoId => {
        const relations = getRelationByMemoId(memoId);
        const exists = relations.find(relation => relation.labelId === labelId);
        if (exists) {
          db.get('labelsToMemos')
            .remove({ labelId, memoId })
            .write();
        }
      });
    }

    /**
     * 해당 Label에 memoCount 수정
     */
    db.get('labels')
      .find({ id: labelId })
      .assign({ memoCount: getRelationByLabelId(labelId).length })
      .write();

    label = getLabelByLabelId(labelId);

    return res.status(httpStatus.OK).send(createResponse(label));
  },
  getMemosByLabel: (req, res) => {
    const labelId = req.params.id;

    const label = getLabelByLabelId(labelId);

    if (!label) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send(createError('unable to find designated label'));
    }

    const relations = getRelationByLabelId(labelId) || [];
    const memoList = relations.map(({ memoId }) => getMemoByMemoId(memoId));

    if (memoList) {
      return res.status(httpStatus.OK).send(createResponse(memoList));
    } else {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send(createError('unable to retrieve label list'));
    }
  },
  getLabelsByMemo: (req, res) => {
    const memoId = req.params.id;

    const memo = getMemoByMemoId(memoId);

    if (!memo) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send(createError('unable to find designated memo'));
    }

    const relations = getRelationByMemoId(memoId) || [];

    const labelList = relations.map(({ labelId }) =>
      getLabelByLabelId(labelId)
    );

    if (labelList) {
      return res.status(httpStatus.OK).send(createResponse(labelList));
    } else {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .send(createError('unable to retrieve label list'));
    }
  },
};
